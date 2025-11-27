# GUDA Implementation Plan - Phase 1: Biometric Core

## Goal
ストーリー診断の裏側で、ユーザーの無意識的な反応（反応速度、迷い、マウスの動き）を記録・分析するシステムを構築する。

## Components

### 1. `BiometricLogger` (New Component)
- **機能**: ユーザーのインタラクションデータをミリ秒単位で記録する。
- **計測データ**:
    - `timeToFirstInteraction`: 画面表示から最初のアクションまでの時間（直感の速さ）。
    - `timeToDecision`: 最終決定までの時間（思考の深さ/迷い）。
    - `hoverDuration`: 各選択肢の上にマウスがあった時間（興味/葛藤）。
    - `clickCount`: 決定までにクリックした回数（迷い/誤操作）。
    - `mouseDistance`: マウスの総移動距離（落ち着きのなさ）。

### 2. `StoryEngine` Update
- `BiometricLogger`を統合し、各シーンごとの生体データを収集する。
- 収集したデータを診断ロジックに渡す。

### 3. `DiagnosisCore` (New Logic)
- 従来の「選択肢による加点」に加え、「反応パターンによる補正」を行う。
- **ロジック例**:
    - 「衝動的な選択肢」を**0.5秒以内**に選んだ → 衝動性スコアを**2倍**にする（真の衝動性）。
    - 「論理的な選択肢」を選んだが、**5秒以上**迷っていた → 論理的思考スコアを**割り引く**（無理して選んでいる可能性）。

## Step-by-Step Implementation
1. `BiometricLogger`フックの作成。
2. `StoryEngine`への組み込み。
3. 収集データの可視化（デバッグ用）。
4. 診断ロジックへの反映。
