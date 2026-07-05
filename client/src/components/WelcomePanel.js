import React from 'react';
import RobotAvatar from './RobotAvatar';

const QUICK_QUESTIONS = [
  '帮我写一封工作邮件',
  '用简单的话解释一个概念',
  '帮我翻译一段文字',
];

function WelcomePanel({ onQuickQuestion, disabled }) {
  return (
    <div className="welcome-panel">
      <RobotAvatar size="large" animated />
      <h2>欢迎使用智能小助手！</h2>
      <p>请向我提问，我会为您提供帮助 😊</p>
      <div className="quick-questions">
        {QUICK_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            className="quick-question-btn"
            onClick={() => onQuickQuestion(question)}
            disabled={disabled}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

export default WelcomePanel;
