import { Routes, Route } from "react-router-dom";

// =========================================================
// PAGES
// =========================================================

import Home from "./pages/Home/Home";
import Journey from "./pages/Journey/Journey";

import Mahabharata from "./pages/Mahabharata/Mahabharata";

import Chapters, {
  ChapterDetail,
} from "./pages/Mahabharata/Chapters";

import Characters from "./pages/Mahabharata/Characters";
import CharacterDetail from "./pages/Mahabharata/CharacterDetail";

import Ramayana from "./pages/Ramayana/Ramayana";
import RamayanaCharacters from "./pages/Ramayana/RamayanaCharacters";
import RamayanaCharacterDetail from "./pages/Ramayana/RamayanaCharacterDetail";
import RamayanaStory from "./pages/Ramayana/RamayanaStory";
import RamayanaChapters from "./pages/Ramayana/RamayanaChapters";
import RamayanaChapterDetail
  from "./pages/Ramayana/RamayanaChapterDetail";
// =========================================================
// COMPONENTS
// =========================================================

import ScrollToTop from "./components/ScrollToTop";

// =========================================================
// APP
// =========================================================

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>

        {/* ===================================================
            HOME
        =================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ===================================================
            JOURNEY
        =================================================== */}

        <Route
          path="/journey"
          element={<Journey />}
        />

        {/* ===================================================
            MAHABHARATA — LANDING
        =================================================== */}

        <Route
          path="/journey/mahabharata"
          element={<Mahabharata />}
        />

        {/* ===================================================
            MAHABHARATA — CHAPTERS
        =================================================== */}

        <Route
          path="/journey/mahabharata/chapters"
          element={<Chapters />}
        />

        {/* ===================================================
            MAHABHARATA — CHAPTER DETAIL
        =================================================== */}

        <Route
          path="/journey/mahabharata/chapters/:chapterId"
          element={<ChapterDetail />}
        />

        {/* ===================================================
            MAHABHARATA — CHARACTERS
        =================================================== */}

        <Route
          path="/journey/mahabharata/characters"
          element={<Characters />}
        />

        {/* ===================================================
            MAHABHARATA — CHARACTER DETAIL
        =================================================== */}

        <Route
          path="/journey/mahabharata/characters/:characterId"
          element={<CharacterDetail />}
        />

        {/* ===================================================
            RAMAYANA — LANDING
        =================================================== */}

        <Route
          path="/journey/ramayana"
          element={<Ramayana />}
        />

        {/* ===================================================
            RAMAYANA — CHARACTERS
        =================================================== */}

        <Route
          path="/journey/ramayana/characters"
          element={<RamayanaCharacters />}
        />

        {/* ===================================================
            RAMAYANA — CHARACTER DETAIL
        =================================================== */}

        <Route
          path="/journey/ramayana/characters/:characterId"
          element={<RamayanaCharacterDetail />}
        />

        {/* ===================================================
            RAMAYANA — CINEMATIC STORY OPENING
        =================================================== */}

        <Route
          path="/journey/ramayana/story"
          element={<RamayanaStory />}
        />

        {/* ===================================================
            RAMAYANA — 24 CHAPTERS
        =================================================== */}

        <Route
          path="/journey/ramayana/chapters"
          element={<RamayanaChapters />}
        />
        <Route
  path="/journey/ramayana/chapters/:chapterId"
  element={<RamayanaChapterDetail />}
/>

        {/* ===================================================
            FALLBACK
        =================================================== */}

        <Route
          path="*"
          element={
            <main
              style={{
                minHeight: "100vh",
                background: "#070605",
                color: "#eee5d2",
                display: "grid",
                placeItems: "center",
                fontFamily: "Arial, sans-serif",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    letterSpacing: "0.3em",
                    fontSize: "12px",
                    opacity: 0.7,
                  }}
                >
                  ANCESTRA
                </p>

                <h1>PAGE NOT FOUND</h1>
              </div>
            </main>
          }
        />

      </Routes>
    </>
  );
}

export default App;