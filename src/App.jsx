import { useEffect, useState } from "react";
import Quiz from "./Quiz";

function slugify(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o");
}

function label(name, kat) {
  return kat ? `${name}, ${kat}` : name;
}

function getImagePaths(manifest, category, name, kat) {
  const dir = `${slugify(category)}/${slugify(name)}/${slugify(kat || name)}/`;
  return Object.keys(manifest).filter((p) => p.startsWith(dir));
}

function findAnimal(data, name) {
  for (const [cat, animals] of Object.entries(data)) {
    for (const a of animals) {
      if (a.namn.toLowerCase() === name.toLowerCase()) return { cat, animal: a };
    }
  }
  return {};
}

function buildOptions(data, category, animal, kat) {
  const correct = label(animal.namn, kat);
  const wrong = [];

  for (const likName of animal.liknande || []) {
    const { animal: lik } = findAnimal(data, likName);
    if (!lik) continue;
    const lKats = lik.kategorier || [];
    if (kat && lKats.includes(kat)) {
      wrong.push(label(lik.namn, kat));
    } else if (lKats.length) {
      wrong.push(label(lik.namn, lKats[Math.floor(Math.random() * lKats.length)]));
    } else {
      wrong.push(label(lik.namn, null));
    }
  }

  if (wrong.length < 3) {
    const sameCat = (data[category] || []).filter((a) => a.namn !== animal.namn);
    const shuffled = sameCat.sort(() => Math.random() - 0.5);
    for (const a of shuffled) {
      if (wrong.length >= 3) break;
      const l = label(a.namn, kat && (a.kategorier || []).includes(kat) ? kat : null);
      if (!wrong.includes(l)) wrong.push(l);
    }
  }

  const options = [correct, ...wrong.slice(0, 3)].sort(() => Math.random() - 0.5);
  return { correct, options };
}

export default function App() {
  const [data, setData] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}vilt.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}manifest.json`).then((r) => r.json()),
    ]).then(([d, m]) => {
      setData(d);
      setManifest(m);
    });
  }, []);

  if (!data || !manifest) return <div className="loader">Laddar...</div>;

  if (questions) {
    return (
      <Quiz
        questions={questions}
        onBack={() => {
          setQuestions(null);
          setSelected(null);
        }}
      />
    );
  }

  const categories = Object.keys(data);

  function start(cats) {
    const pool = [];
    for (const cat of cats) {
      for (const animal of data[cat]) {
        const kats = animal.kategorier?.length ? animal.kategorier : [null];
        for (const kat of kats) {
          const imgs = getImagePaths(manifest, cat, animal.namn, kat);
          if (imgs.length) {
            const { correct, options } = buildOptions(data, cat, animal, kat);
            pool.push({ imgs, correct, options });
          }
        }
      }
    }
    // Expand each pool entry into one question per image, ensuring no image repeats
    const expanded = [];
    for (const q of pool) {
      for (const img of q.imgs) {
        expanded.push({ correct: q.correct, options: q.options, img: `${import.meta.env.BASE_URL}images/${img}` });
      }
    }
    expanded.sort(() => Math.random() - 0.5);
    setQuestions(expanded.slice(0, 20));
  }

  return (
    <div className="menu">
      <h1>Vilt-testet</h1>
      <p>Välj kategori:</p>
      <div className="cat-list">
        {categories.map((cat) => (
          <button
            key={cat}
            className={selected === cat ? "active" : ""}
            onClick={() => {
              setSelected(cat);
              start([cat]);
            }}
          >
            {cat} ({data[cat].length})
          </button>
        ))}
        <button
          className="all"
          onClick={() => {
            setSelected("all");
            start(categories);
          }}
        >
          Alla kategorier
        </button>
      </div>
    </div>
  );
}
