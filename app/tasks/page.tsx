'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ローカルストレージからタスクを読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (error) {
          console.error('Failed to parse tasks:', error);
        }
      }
    }
    setIsLoading(false);
  }, []);

  // タスクをローカルストレージに保存
  const saveTasks = (updatedTasks: Task[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      } catch (error) {
        console.error('Failed to save tasks:', error);
      }
    }
    setTasks(updatedTasks);
  };

  // タスクを追加
  const addTask = () => {
    if (newTaskTitle.trim() === '') return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...tasks, newTask];
    saveTasks(updatedTasks);
    setNewTaskTitle('');
  };

  // タスクの完了状態を切り替え
  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  // タスクを削除
  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    saveTasks(updatedTasks);
  };

  // Enterキーでタスクを追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center">読み込み中...</div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">タスク管理</h1>
        <p className="text-gray-600">
          日々のタスクを記録・管理できます
        </p>
      </div>

      {/* タスク追加フォーム */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={addTask}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            追加
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      {totalCount > 0 && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {completedCount} / {totalCount} タスク完了
        </div>
      )}

      {/* タスク一覧 */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">タスクがありません</p>
          <p className="text-sm">上記のフォームから新しいタスクを追加してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span
                className={`flex-1 ${
                  task.completed
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

