import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import "./RamayanaChapters.css";

// =========================================================
// RAMAYANA — 24 CHAPTERS
// =========================================================

const chapters = [
  {
    id: 1,
    number: "I",
    title: "The Birth of the Divine Prince",
    subtitle: "BALA KANDA",
    description:
      "Ayodhya awaits the birth of an heir. Through sacrifice, destiny, and divine purpose, Rama enters the world as the prince who will shape an age.",
  },

  {
    id: 2,
    number: "II",
    title: "The Making of the Princes",
    subtitle: "BALA KANDA",
    description:
      "Rama grows beneath the guidance of Dasharatha, learning the duties of a prince, the discipline of a warrior, and the path of dharma.",
  },

  {
    id: 3,
    number: "III",
    title: "The Sage and the Forest",
    subtitle: "BALA KANDA",
    description:
      "The road before them was no longer the measured path of palace courtyards and training grounds. It was a road through rivers, forests, hermitages, and places where ancient stories still seemed to live within the land itself.",
  },

  {
    id: 4,
    number: "IV",
    title: "Mithila and Sita",
    subtitle: "BALA KANDA",
    description:
      "The great bow is lifted and broken. Rama and Sita are united in marriage, while the royal families of Ayodhya and Mithila celebrate a sacred union.",
  },

  {
    id: 5,
    number: "V",
    title: "The Crown That Never Came",
    subtitle: "AYODHYA KANDA",
    description:
      "Ayodhya prepares to crown Rama, but an ancient promise made by Dasharatha changes the course of the kingdom and sends Rama toward exile.",
  },

  {
    id: 6,
    number: "VI",
    title: "Fourteen Years into the Forest",
    subtitle: "AYODHYA KANDA",
    description:
      "Rama leaves Ayodhya. Sita and Lakshmana choose to walk beside him, beginning a journey that will take them far beyond the boundaries of the kingdom.",
  },

  {
    id: 7,
    number: "VII",
    title: "The Forest of Dandaka",
    subtitle: "ARANYA KANDA",
    description:
      "Life in the wilderness unfolds among sages, sacred forests, rakshasas, and ancient hermitages as Rama, Sita, and Lakshmana move deeper into the forest.",
  },

  {
    id: 8,
    number: "VIII",
    title: "The Abduction of Sita",
    subtitle: "ARANYA KANDA",
    description:
      "A carefully woven deception separates Rama from Sita. Ravana takes Sita to Lanka, transforming Rama's exile into a search that will shake kingdoms.",
  },

  {
    id: 9,
    number: "IX",
    title: "The Meeting with Hanuman",
    subtitle: "KISHKINDHA KANDA",
    description:
      "Rama reaches Kishkindha and encounters Hanuman. Their meeting becomes the beginning of a bond between devotion and destiny.",
  },

  {
    id: 10,
    number: "X",
    title: "The Fall of Vali",
    subtitle: "KISHKINDHA KANDA",
    description:
      "Rama becomes involved in the conflict between Vali and Sugriva. The future of Kishkindha changes, and Sugriva takes his place as king.",
  },

  {
    id: 11,
    number: "XI",
    title: "The Search for Sita",
    subtitle: "KISHKINDHA KANDA",
    description:
      "Vanara search parties journey across the world. At the southern ocean, the path toward Lanka finally becomes clear.",
  },

  {
    id: 12,
    number: "XII",
    title: "Hanuman in Lanka",
    subtitle: "SUNDARA KANDA",
    description:
      "Hanuman crosses the ocean and enters Lanka. He finds Sita in the Ashoka grove, carries Rama's message to her, and returns with hope.",
  },

  // ==========================================
  // YUDDHA KANDA — THE GREAT WAR
  // ==========================================

  {
    id: 13,
    number: "XIII",
    title: "The Bridge Across the Ocean",
    subtitle: "YUDDHA KANDA",
    description:
      "Rama's army reaches the ocean. After seeking the ocean's cooperation, Nala leads the construction of the great bridge to Lanka. The Vanara army begins its extraordinary crossing toward the golden kingdom.",
  },

  {
    id: 14,
    number: "XIV",
    title: "The Gates of Lanka",
    subtitle: "YUDDHA KANDA",
    description:
      "Rama's forces arrive before the golden city. Angada carries Rama's final message of peace into Ravana's court, but the king refuses to surrender Sita. The armies prepare for the inevitable war.",
  },

  {
    id: 15,
    number: "XV",
    title: "The First Assault on Lanka",
    subtitle: "YUDDHA KANDA",
    description:
      "The first great clashes erupt beneath Lanka's walls. Vanara champions confront the Rakshasa commanders as Indrajit enters the battlefield with his formidable celestial weapons. The Nagapasha brings Rama and Lakshmana into grave danger.",
  },

  {
    id: 16,
    number: "XVI",
    title: "The Awakening and Fall of Kumbhakarna",
    subtitle: "YUDDHA KANDA",
    description:
      "As Lanka suffers mounting losses, Ravana turns to his sleeping brother. Kumbhakarna awakens and learns of the war, questions his brother's actions, and ultimately chooses to stand beside him.",
  },

  {
    id: 17,
    number: "XVII",
    title: "The Mountain of Life",
    subtitle: "YUDDHA KANDA",
    description:
      "A powerful weapon leaves Lakshmana gravely wounded. Hanuman undertakes an extraordinary journey to the Himalayas in search of the life-restoring herbs. Unable to identify the precise medicinal plant, he carries the entire mountain back to Lanka, bringing hope and recovery to the battlefield.",
  },

  {
    id: 18,
    number: "XVIII",
    title: "The Fall of Indrajit",
    subtitle: "YUDDHA KANDA",
    description:
      "Indrajit prepares his powerful ritual at Nikumbhila, seeking to secure victory for Lanka. Guided by Vibhishana, Lakshmana confronts the formidable warrior. Their final battle becomes one of the greatest duels of the war, ending with Indrajit's defeat.",
  },

  {
    id: 19,
    number: "XIX",
    title: "The Last Defenders of Lanka",
    subtitle: "YUDDHA KANDA",
    description:
      "With his greatest warriors fallen, Ravana sends the remaining champions of Lanka into battle. The Vanara commanders face the kingdom's final resistance as the golden city approaches its darkest hour.",
  },

  {
    id: 20,
    number: "XX",
    title: "The Fall of Ravana",
    subtitle: "YUDDHA KANDA",
    description:
      "Grieving the loss of his champions, Ravana enters the battlefield for the final time. Rama and the king of Lanka meet in a decisive confrontation of extraordinary courage, power, and resolve. The ruler of Lanka finally falls.",
  },

  {
    id: 21,
    number: "XXI",
    title: "The Return to Ayodhya",
    subtitle: "YUDDHA KANDA",
    description:
      "With the war ended, Vibhishana is crowned king of Lanka and Sita is reunited with Rama. The companions begin their journey home aboard the Pushpaka Vimana. After fourteen years, Ayodhya prepares to welcome its rightful king.",
  },

  // ==========================================
  // UTTARA KANDA — THE FINAL CHAPTERS
  // ==========================================

  {
    id: 22,
    number: "XXII",
    title: "The Reign of Rama",
    subtitle: "UTTARA KANDA",
    description:
      "Rama begins his reign over Ayodhya. His kingdom enters an age remembered for justice, order, prosperity, and devotion to dharma.",
  },

  {
    id: 23,
    number: "XXIII",
    title: "The Shadow Over Ayodhya",
    subtitle: "UTTARA KANDA",
    description:
      "Even in an age of prosperity, the burdens of kingship remain. Rama faces a painful conflict between his personal life and his responsibility as king.",
  },

  {
    id: 24,
    number: "XXIV",
    title: "Luv and Kush",
    subtitle: "UTTARA KANDA",
    description:
      "Far from Ayodhya, Sita's sons Luv and Kush grow under the guidance of Valmiki and learn the story of their own royal lineage.",
  },

  {
    id: 25,
    number: "XXV",
    title: "The Horse of the Ashvamedha",
    subtitle: "UTTARA KANDA",
    description:
      "Rama performs the Ashvamedha. The sacred horse travels across kingdoms, eventually bringing Luv and Kush into the story of Ayodhya.",
  },

  {
    id: 26,
    number: "XXVI",
    title: "Sita's Final Return",
    subtitle: "UTTARA KANDA",
    description:
      "Sita stands before the kingdom and calls upon the Earth, her eternal mother. Her earthly journey reaches its final sacred turning point.",
  },

  {
    id: 27,
    number: "XXVII",
    title: "The Last Days of Rama",
    subtitle: "UTTARA KANDA",
    description:
      "The age of Rama approaches its final chapter. The king completes the last duties of his earthly life as the old generation passes into memory.",
  },

  {
    id: 28,
    number: "XXVIII",
    title: "The End of Ramyug",
    subtitle: "UTTARA KANDA",
    description:
      "Rama prepares for his final departure. His earthly reign comes to an end, but the ideals of his age continue through story, memory, and dharma.",
  },
];

// =========================================================
// COMPONENT
// =========================================================

export default function RamayanaChapters() {
  return (
    <main className="ramayana-chapters">

      {/* =====================================================
          ATMOSPHERE
      ===================================================== */}

      <div className="ramayana-chapters__glow" />

      <div className="ramayana-chapters__geometry">
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ramayana-chapters__header">

        <Link
          to="/journey/ramayana"
          className="ramayana-chapters__back"
        >
          <ArrowLeft size={16} strokeWidth={1.4} />
          <span>RAMAYANA</span>
        </Link>

        <div className="ramayana-chapters__brand">
          ANCESTRA
        </div>

        <div className="ramayana-chapters__label">
          THE CHRONICLE
        </div>

      </header>

      {/* =====================================================
          INTRO
      ===================================================== */}

      <section className="ramayana-chapters__intro">

        <motion.span
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.9,
          }}
        >
          THE EPIC OF DHARMA
        </motion.span>

        <motion.h1
          initial={{
            opacity: 0,
            y: 35,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1.1,
            delay: 0.15,
          }}
        >
          THE CHRONICLE
        </motion.h1>

        <motion.div
          className="ramayana-chapters__ornament"
          initial={{
            opacity: 0,
            scaleX: 0,
          }}
          animate={{
            opacity: 1,
            scaleX: 1,
          }}
          transition={{
            duration: 1,
            delay: 0.35,
          }}
        >
          <i />
          <span>✦</span>
          <i />
        </motion.div>

        <motion.p
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.9,
            delay: 0.5,
          }}
        >
          Twenty-eight chapters. One journey through an age of dharma.
        </motion.p>

      </section>

      {/* =====================================================
          KANDA INTRODUCTION
      ===================================================== */}

      <div className="ramayana-chapters__kanda-intro">

        <span className="ramayana-chapters__kanda-line" />

        <span>
          BALA · AYODHYA · ARANYA · KISHKINDHA · SUNDARA · YUDDHA · UTTARA
        </span>

        <span className="ramayana-chapters__kanda-line" />

      </div>

      {/* =====================================================
          CHAPTER LIST
      ===================================================== */}

      <section className="ramayana-chapters__list">

        {chapters.map((chapter, index) => (

          <motion.article
            key={chapter.id}
            className="ramayana-chapter-card"

            initial={{
              opacity: 0,
              y: 35,
            }}

            whileInView={{
              opacity: 1,
              y: 0,
            }}

            viewport={{
              once: true,
              amount: 0.15,
            }}

            transition={{
              duration: 0.7,
              delay: Math.min(index * 0.04, 0.3),
              ease: [0.22, 1, 0.36, 1],
            }}
          >

            {/* NUMBER */}

            <div className="ramayana-chapter-card__number">
              {chapter.number}
            </div>

            {/* CONTENT */}

            <div className="ramayana-chapter-card__content">

              <span>
                {chapter.subtitle}
              </span>

              <h2>
                {chapter.title}
              </h2>

              <p>
                {chapter.description}
              </p>

            </div>

            {/* OPEN BUTTON */}

            <Link
              to={`/journey/ramayana/chapters/${chapter.id}`}
              className="ramayana-chapter-card__button"
              aria-label={`Open ${chapter.title}`}
            >
              <ArrowRight
                size={18}
                strokeWidth={1.3}
              />
            </Link>

          </motion.article>

        ))}

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="ramayana-chapters__footer">

        <span>
          ANCESTRA
        </span>

        <span>
          RAMAYANA
        </span>

        <span>
          THE PATH OF DHARMA
        </span>

      </footer>

    </main>
  );
}