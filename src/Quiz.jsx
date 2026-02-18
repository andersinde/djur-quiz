import { useEffect, useCallback, useState } from "react";

export default function Quiz({ questions, onBack }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);

  const q = done ? null : questions[index];

  const answer = useCallback(
    (opt) => {
      if (picked !== null || done) return;
      setPicked(opt);
      if (opt === q.correct) {
        setScore((s) => s + 1);
      } else {
        setLocked(true);
        setTimeout(() => setLocked(false), 2000);
      }
    },
    [picked, done, q],
  );

  const next = useCallback(() => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  }, [index, questions.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === " ") {
        e.preventDefault();
        if (picked !== null && !done && !locked) next();
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && q && picked === null) {
        const opt = q.options[num - 1];
        if (opt) answer(opt);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, done, locked, next, answer, q]);

  if (done) {
    return (
      <div className="result">
        <h1>Resultat</h1>
        <p className="score">
          {score} / {questions.length}
        </p>
        <p className="pct">{Math.round((score / questions.length) * 100)}%</p>
        <div className="result-actions">
          <button onClick={onBack}>Tillbaka</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-header">
        <p className="prompt">Vilket är djuret på bilden?</p>
        <span className="progress">
          Fråga {index + 1} av {questions.length}
        </span>
      </div>

      <div className="image-wrap">
        <img src={q.img} alt="Vilt" />
      </div>

      <div className="options">
        {q.options.map((opt, i) => {
          let cls = "opt";
          if (picked !== null) {
            if (opt === q.correct) cls += " correct";
            else if (opt === picked) cls += " wrong";
          }
          return (
            <button
              key={opt}
              className={cls}
              onClick={() => {
                if (picked !== null && !locked) next();
                else answer(opt);
              }}
            >
              <span className="opt-num">{i + 1}</span> {opt}
            </button>
          );
        })}
      </div>

    </div>
  );
}
