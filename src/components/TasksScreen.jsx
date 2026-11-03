import React, { useState } from 'react';
import { Plus, Check, ChevronRight, Search, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AutoScrollText from './AutoScrollText.jsx';
import { hapticLight, hapticMedium, hapticSuccess, playCheckSound, playUncheckSound } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useLongPress } from '../lib/useLongPress.js';

function TaskItemCard({
  todo,
  isFirst,
  onToggleTodo,
  onEditTodo,
  onItemLongPress,
  t,
  currentTheme,
  isSearching = false,
}) {
  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) {
        onItemLongPress({ type: 'task', item: todo });
      }
    },
    () => {
      onEditTodo(todo);
    }
  );

  return (
    <Card
      {...longPressProps}
      id={isFirst ? "tour-task-item" : undefined}
      className="p-4 flex flex-row items-center justify-between cursor-pointer transition-transform active:scale-[0.98] select-none"
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (todo.done) {
              playUncheckSound();
              hapticMedium();
            } else {
              playCheckSound();
              hapticSuccess();
            }
            onToggleTodo(todo.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          className={`check-btn ${todo.done ? 'checked' : ''}`}
        >
          {todo.done && <Check size={15} color={currentTheme.primaryForeground} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <AutoScrollText
            as="h3"
            dir="auto"
            className={`text-[15px] font-bold tracking-tight text-start ${
              todo.done ? 'line-through text-[#8E8E93]' : 'text-white'
            }`}
          >
            {todo.text}
          </AutoScrollText>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <p className="text-xs font-medium text-[#8E8E93] text-start">
              {todo.dueDate || t('default_due')}
            </p>
            {isSearching && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  todo.done
                    ? 'bg-[#222227] text-[#8E8E93] border border-[#2E2E36]'
                    : 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20'
                }`}
              >
                {todo.done ? t('filter_done') : t('filter_open')}
              </span>
            )}
            {todo.remindBefore && todo.remindBefore !== 'none' && (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-[var(--primary,#FF2442)] font-semibold shrink-0"
                title={t('task_reminder_title')}
              >
                <Bell size={11} strokeWidth={2.4} />
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <ChevronRight size={18} className="text-[#545458] rtl:rotate-180" />
      </div>
    </Card>
  );
}

export default function TasksScreen({
  todos = [],
  onToggleTodo,
  onOpenAddTask,
  onEditTodo,
  onItemLongPress,
}) {
  const { t } = useI18n();
  const { currentTheme } = useTheme();
  const [filter, setFilter] = useState('Open');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all'); // 'all' | 'open' | 'done'

  const filterTabs = [
    { key: 'Open', label: t('filter_open') },
    { key: 'Today', label: t('filter_today') },
    { key: 'Upcoming', label: t('filter_upcoming') },
    { key: 'Done', label: t('filter_done') },
  ];

  const todayRaw = new Date().toISOString().slice(0, 10);
  const isTodayTask = (todo) => {
    if (todo.dueDateRaw) return todo.dueDateRaw === todayRaw;
    return todo.dueDate?.toLowerCase().includes('today') || !todo.dueDate;
  };

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  // 1. Search across tasks
  const allSearchMatches = isSearching
    ? todos.filter((todo) => {
        const text = (todo.text || '').toLowerCase();
        const due = (todo.dueDate || '').toLowerCase();
        return text.includes(query) || due.includes(query);
      })
    : [];

  const openSearchMatches = allSearchMatches.filter((t) => !t.done);
  const doneSearchMatches = allSearchMatches.filter((t) => t.done);

  // 2. Select tasks to display based on mode
  let filteredTodos;
  if (isSearching) {
    if (searchScope === 'open') {
      filteredTodos = openSearchMatches;
    } else if (searchScope === 'done') {
      filteredTodos = doneSearchMatches;
    } else {
      filteredTodos = allSearchMatches;
    }
  } else {
    filteredTodos = todos.filter((todo) => {
      if (filter === 'Today') {
        return !todo.done && isTodayTask(todo);
      }
      if (filter === 'Upcoming') {
        return !todo.done && !isTodayTask(todo);
      }
      if (filter === 'Done') {
        return todo.done;
      }
      // 'Open': only show all open (uncompleted) active tasks
      return !todo.done;
    });
  }

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchScope('all');
  };

  return (
    <div className="flex-1 px-5 pt-3 pb-32">
      {/* Header with Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">{t('tasks_title')}</h1>
        <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
          {t('tasks_subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3.5">
        <div className="absolute inset-y-0 start-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-[#8E8E93]">
          <Search size={17} strokeWidth={2.2} />
        </div>
        <input
          type="text"
          dir="auto"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            if (!searchQuery && val) {
              setSearchScope('all');
            }
            setSearchQuery(val);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClearSearch();
            }
          }}
          placeholder={t('search_tasks_placeholder')}
          className="w-full h-11 rounded-2xl bg-[#121214] border border-[#1C1C20] pl-10 pr-9 rtl:pl-9 rtl:pr-10 text-[14px] font-medium text-white placeholder:text-[#545458] outline-none transition-all focus:border-[var(--primary,#FF2442)] focus:bg-[#161619]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 end-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            title={t('clear_search')}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Tabs / Search Scope Tabs */}
      <div id="tour-tasks-filters" className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {isSearching ? (
          <>
            {[
              { key: 'all', label: t('filter_all'), count: allSearchMatches.length },
              { key: 'open', label: t('filter_open'), count: openSearchMatches.length },
              { key: 'done', label: t('filter_done'), count: doneSearchMatches.length },
            ].map((tab) => {
              const isActive = searchScope === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    hapticMedium();
                    setSearchScope(tab.key);
                  }}
                  className="outline-none"
                >
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className={`h-9 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                        : 'bg-[#1C1C22] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-black/25 text-[var(--primary-foreground)]'
                          : 'bg-[#282830] text-[#AEAEB2]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </Badge>
                </button>
              );
            })}
          </>
        ) : (
          filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  hapticMedium();
                  setFilter(tab.key);
                }}
                className="outline-none"
              >
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'bg-[#1C1C22] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-black/25 text-[var(--primary-foreground)]'
                          : 'bg-[#282830] text-[#AEAEB2]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </Badge>
              </button>
            );
          })
        )}
      </div>

      {/* Task List */}
      <div id="tour-tasks-feed" className="items-list">
        {filteredTodos.length === 0 && (
          <Card className="p-6 text-center">
            {isSearching ? (
              <div className="py-2">
                <p className="text-sm font-semibold text-white">{t('no_search_results')}</p>
                <p className="text-xs text-[#8E8E93] mt-1">{t('no_search_results_desc')}</p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  {t('clear_search')}
                </button>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm font-semibold text-white">{t('no_tasks')}</p>
                <p className="text-xs text-[#8E8E93] mt-1">{t('no_tasks_desc')}</p>
              </div>
            )}
          </Card>
        )}
        {filteredTodos.map((todo, idx) => (
          <TaskItemCard
            key={todo.id}
            isFirst={idx === 0}
            todo={todo}
            isSearching={isSearching}
            onToggleTodo={onToggleTodo}
            onEditTodo={onEditTodo}
            onItemLongPress={onItemLongPress}
            t={t}
            currentTheme={currentTheme}
          />
        ))}
      </div>

      {/* Floating Action Button to add task */}
      <div className="fixed bottom-[78px] left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 pointer-events-none z-30 flex justify-end rtl:justify-start">
        <button
          id="tour-add-task"
          type="button"
          onClick={() => {
            hapticMedium();
            onOpenAddTask();
          }}
          className="pointer-events-auto h-13 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-[14px] flex items-center gap-2.5 active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-[0_10px_28px_rgba(0,0,0,0.55),0_0_22px_var(--primary-subtle)] border border-white/20"
          title={t('modal_add_task')}
        >
          <Plus size={22} color={currentTheme.primaryForeground} strokeWidth={2.8} />
          <span>{t('modal_add_task')}</span>
        </button>
      </div>
    </div>
  );
}
