'use client';

import { useState, useEffect } from 'react';
import { useBiometricLogger } from './biometricLogger';
import type { Episode, Scene, Choice, EpisodeResult } from './types';
import scenariosData from './scenarios.json';

const scenarios = scenariosData as Episode[];

interface StoryEngineProps {
  episodes: Episode[];
  onSceneComplete: (result: EpisodeResult) => void;
  onEpisodeComplete: () => void;
  currentEpisodeIndex: number;
}

export function StoryEngine({
  episodes,
  onSceneComplete,
  onEpisodeComplete,
  currentEpisodeIndex,
}: StoryEngineProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  
  const biometricLogger = useBiometricLogger();
  const currentEpisode = episodes[currentEpisodeIndex];
  const currentScene = currentEpisode?.scenes[currentSceneIndex];

  useEffect(() => {
    biometricLogger.reset();
    setCurrentSceneIndex(0);
    setSelectedChoice(null);
  }, [currentEpisodeIndex, biometricLogger]);

  if (!currentEpisode || !currentScene) {
    return null;
  }

  const handleChoiceSelect = (choiceId: string) => {
    if (selectedChoice) return; // 既に選択済み

    biometricLogger.recordClick();
    setSelectedChoice(choiceId);
  };

  const handleChoiceConfirm = () => {
    if (!selectedChoice) return;

    biometricLogger.recordDecision(selectedChoice);
    const biometricData = biometricLogger.getBiometricData();

    const result: EpisodeResult = {
      episodeId: currentEpisode.id,
      sceneId: currentScene.id,
      choiceId: selectedChoice,
      biometricData,
      timestamp: Date.now(),
    };

    onSceneComplete(result);

    // 次のシーンまたはエピソードへ
    if (currentSceneIndex < currentEpisode.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
      setSelectedChoice(null);
    } else {
      // このエピソードが完了
      onEpisodeComplete();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          エピソード {currentEpisodeIndex + 1} / {episodes.length}
        </div>
        <h2 className="text-2xl font-bold mb-2">{currentEpisode.title}</h2>
        <p className="text-gray-600 mb-6">{currentEpisode.description}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <p className="text-lg mb-6 leading-relaxed">{currentScene.text}</p>

        <div className="space-y-3">
          {currentScene.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoiceSelect(choice.id)}
              onMouseEnter={() => biometricLogger.recordHoverStart(choice.id)}
              onMouseLeave={() => biometricLogger.recordHoverEnd(choice.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedChoice === choice.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {selectedChoice && (
          <div className="mt-6">
            <button
              onClick={handleChoiceConfirm}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              決定する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

