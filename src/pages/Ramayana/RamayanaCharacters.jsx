import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import "./RamayanaCharacters.css";

/* =========================================================
   ANCESTRA — RAMAYANA CHARACTER ROSTER
========================================================= */

const characters = [

  /* =====================================================
     I. AYODHYA — THE HOUSE OF RAGHU
  ===================================================== */

  {
    id: "rama",
    number: "01",
    role: "THE EXILED PRINCE",
    name: "RAMA",
    group: "ayodhya",
    description:
      "The prince of Ayodhya whose devotion to dharma carried him through exile, sacrifice, war and destiny.",
    image: "/images/characters/rama.jpg",
  },

  {
    id: "sita",
    number: "02",
    role: "THE DIVINE QUEEN",
    name: "SITA",
    group: "mithila",
    description:
      "The noble queen of Rama, embodiment of grace, strength and unwavering devotion through the trials of destiny.",
    image: "/images/characters/sita.jpg",
  },

  {
    id: "lakshmana",
    number: "03",
    role: "THE DEVOTED BROTHER",
    name: "LAKSHMANA",
    group: "ayodhya",
    description:
      "Rama's devoted younger brother who willingly followed him into exile and stood beside him through every trial.",
    image: "/images/characters/lakshmana.jpg",
  },

  {
    id: "bharata",
    number: "04",
    role: "THE RELUCTANT KING",
    name: "BHARATA",
    group: "ayodhya",
    description:
      "The prince who rejected a throne gained through injustice and preserved Rama's rightful place in Ayodhya.",
    image: "/images/characters/bharata.jpg",
  },

  {
    id: "shatrughna",
    number: "05",
    role: "THE SILENT WARRIOR",
    name: "SHATRUGHNA",
    group: "ayodhya",
    description:
      "The youngest son of Dasharatha, a steadfast warrior whose loyalty remained quietly bound to his family.",
    image: "/images/characters/shatrughna.jpg",
  },

  {
    id: "dasharatha",
    number: "06",
    role: "THE KING OF AYODHYA",
    name: "DASHARATHA",
    group: "ayodhya",
    description:
      "The great king of Ayodhya whose love for his sons and ancient promises ultimately changed the course of the kingdom.",
    image: "/images/characters/dasharatha.jpg",
  },

  {
    id: "kaushalya",
    number: "07",
    role: "THE QUEEN MOTHER",
    name: "KAUSHALYA",
    group: "ayodhya",
    description:
      "The principal queen of Dasharatha and mother of Rama, whose dignity endured through joy, separation and grief.",
    image: "/images/characters/kaushalya.jpg",
  },

  {
    id: "kaikeyi",
    number: "08",
    role: "THE QUEEN OF AYODHYA",
    name: "KAIKEYI",
    group: "ayodhya",
    description:
      "A beloved queen whose two ancient boons transformed the royal succession and sent Rama into exile.",
    image: "/images/characters/kaikeyi.jpg",
  },

  {
    id: "sumitra",
    number: "09",
    role: "THE WISE QUEEN",
    name: "SUMITRA",
    group: "ayodhya",
    description:
      "The wise queen of Ayodhya and mother of Lakshmana and Shatrughna, remembered for her strength and understanding.",
    image: "/images/characters/sumitra.jpg",
  },

  {
    id: "manthara",
    number: "10",
    role: "THE INSTIGATOR",
    name: "MANTHARA",
    group: "ayodhya",
    description:
      "Kaikeyi's attendant whose counsel influenced the queen and helped set the events of Rama's exile into motion.",
    image: "/images/characters/manthara.jpg",
  },


  /* =====================================================
     II. MITHILA — THE HOUSE OF JANAKA
  ===================================================== */

  {
    id: "janaka",
    number: "11",
    role: "THE PHILOSOPHER KING",
    name: "JANAKA",
    group: "mithila",
    description:
      "The enlightened king of Mithila, father of Sita and a ruler celebrated for wisdom, detachment and dharma.",
    image: "/images/characters/janaka.jpg",
  },

  {
    id: "sunaina",
    number: "12",
    role: "THE QUEEN OF MITHILA",
    name: "SUNAINA",
    group: "mithila",
    description:
      "The gracious queen of Mithila and mother of Sita, whose compassion and royal dignity shaped the household of Janaka.",
    image: "/images/characters/sunaina.jpg",
  },

  {
    id: "urmila",
    number: "13",
    role: "THE FORGOTTEN PRINCESS",
    name: "URMILA",
    group: "mithila",
    description:
      "The princess of Mithila and wife of Lakshmana, whose quiet sacrifice remained far from the center of the great journey.",
    image: "/images/characters/urmila.jpg",
  },

  {
    id: "mandavi",
    number: "14",
    role: "THE PRINCESS OF MITHILA",
    name: "MANDAVI",
    group: "mithila",
    description:
      "The princess who became Bharata's wife, joining the destiny of Mithila with the royal house of Ayodhya.",
    image: "/images/characters/mandavi.jpg",
  },

  {
    id: "shrutakirti",
    number: "15",
    role: "THE YOUNGEST PRINCESS",
    name: "SHRUTAKIRTI",
    group: "mithila",
    description:
      "The youngest princess of Mithila and wife of Shatrughna, completing the bond between the two royal families.",
    image: "/images/characters/shrutakirti.jpg",
  },


  /* =====================================================
     III. SAGES & GUIDES — THE VOICES OF DHARMA
  ===================================================== */

  {
    id: "vishvamitra",
    number: "16",
    role: "THE WARRIOR SAGE",
    name: "VISHVAMITRA",
    group: "sages",
    description:
      "The formidable sage who guided Rama and Lakshmana, introducing them to divine weapons and the deeper path of dharma.",
    image: "/images/characters/vishvamitra.jpg",
  },

  {
    id: "vashishtha",
    number: "17",
    role: "THE ROYAL SAGE",
    name: "VASHISHTHA",
    group: "sages",
    description:
      "The revered royal sage of Ayodhya whose wisdom guided generations of the House of Raghu.",
    image: "/images/characters/vashishtha.jpg",
  },

  {
    id: "agastya",
    number: "18",
    role: "THE GREAT SAGE",
    name: "AGASTYA",
    group: "sages",
    description:
      "The powerful sage of the southern forests whose wisdom and divine knowledge aided Rama during his journey.",
    image: "/images/characters/agastya.jpg",
  },

  {
    id: "shabari",
    number: "19",
    role: "THE DEVOTED ASCETIC",
    name: "SHABARI",
    group: "sages",
    description:
      "A devoted ascetic whose unwavering faith and simple devotion became one of the journey's most enduring moments.",
    image: "/images/characters/shabari.jpg",
  },

  {
    id: "parashurama",
    number: "20",
    role: "THE WARRIOR SAGE",
    name: "PARASHURAMA",
    group: "sages",
    description:
      "The legendary warrior sage whose encounter with Rama marked a powerful turning point in the prince's destiny.",
    image: "/images/characters/parashurama.jpg",
  },


  /* =====================================================
     IV. KISHKINDHA & ALLIES — THE VANARA WARRIORS
  ===================================================== */

  {
    id: "hanuman",
    number: "21",
    role: "THE DIVINE DEVOTEE",
    name: "HANUMAN",
    group: "kishkindha",
    description:
      "The extraordinary Vanara hero whose devotion, strength, wisdom and courage became indispensable to Rama's mission.",
    image: "/images/characters/hanuman.jpg",
  },

  {
    id: "sugriva",
    number: "22",
    role: "THE EXILED KING",
    name: "SUGRIVA",
    group: "kishkindha",
    description:
      "The exiled king of Kishkindha who formed an alliance with Rama and helped unite the Vanara forces.",
    image: "/images/characters/sugriva.jpg",
  },

  {
    id: "vali",
    number: "23",
    role: "THE MIGHTY KING",
    name: "VALI",
    group: "kishkindha",
    description:
      "The immensely powerful king of Kishkindha whose strength and tragic conflict with Sugriva shaped the Vanara kingdom.",
    image: "/images/characters/vali.jpg",
  },

  {
    id: "tara",
    number: "24",
    role: "THE WISE QUEEN",
    name: "TARA",
    group: "kishkindha",
    description:
      "The wise queen of Kishkindha whose intelligence and foresight brought clarity during the kingdom's darkest moments.",
    image: "/images/characters/tara.jpg",
  },

  {
    id: "angada",
    number: "25",
    role: "THE YOUNG PRINCE",
    name: "ANGADA",
    group: "kishkindha",
    description:
      "The son of Vali and prince of Kishkindha who became a courageous leader within Rama's alliance.",
    image: "/images/characters/angada.jpg",
  },

  {
    id: "jambavan",
    number: "26",
    role: "THE ANCIENT WARRIOR",
    name: "JAMBAVAN",
    group: "kishkindha",
    description:
      "The ancient bear-warrior whose wisdom and experience helped awaken Hanuman's forgotten understanding of his own strength.",
    image: "/images/characters/jambavan.jpg",
  },

  {
    id: "nala",
    number: "27",
    role: "THE MASTER BUILDER",
    name: "NALA",
    group: "kishkindha",
    description:
      "The gifted Vanara architect whose engineering skill became essential to the construction of the bridge toward Lanka.",
    image: "/images/characters/nala.jpg",
  },

  {
    id: "nila",
    number: "28",
    role: "THE WARRIOR COMMANDER",
    name: "NILA",
    group: "kishkindha",
    description:
      "A powerful Vanara commander who played a major role in organizing and leading Rama's forces.",
    image: "/images/characters/nila.jpg",
  },

  {
    id: "jatayu",
    number: "29",
    role: "THE KING OF VULTURES",
    name: "JATAYU",
    group: "kishkindha",
    description:
      "The noble king of vultures who stood against Ravana to protect Sita, embodying courage and sacrifice.",
    image: "/images/characters/jatayu.jpg",
  },

  {
    id: "sampati",
    number: "30",
    role: "THE ELDER VULTURE",
    name: "SAMPATI",
    group: "kishkindha",
    description:
      "Jatayu's elder brother whose knowledge of Lanka became vital in helping Rama's allies discover Sita's whereabouts.",
    image: "/images/characters/sampati.jpg",
  },


  /* =====================================================
     V. LANKA & THE RAKSHASA REALM
  ===================================================== */

  {
    id: "ravana",
    number: "31",
    role: "THE KING OF LANKA",
    name: "RAVANA",
    group: "lanka",
    description:
      "The formidable ruler of golden Lanka, renowned for his immense power, scholarship, ambition and defiance of dharma.",
    image: "/images/characters/ravana.jpg",
  },

  {
    id: "kumbhakarna",
    number: "32",
    role: "THE SLEEPING GIANT",
    name: "KUMBHAKARNA",
    group: "lanka",
    description:
      "Ravana's colossal brother, a devastating warrior whose loyalty to his kingdom conflicted with his understanding of right and wrong.",
    image: "/images/characters/kumbhakarna.jpg",
  },

  {
    id: "vibhishana",
    number: "33",
    role: "THE RIGHTEOUS BROTHER",
    name: "VIBHISHANA",
    group: "lanka",
    description:
      "Ravana's brother who chose dharma over loyalty to Lanka and ultimately joined Rama's cause.",
    image: "/images/characters/vibhishana.jpg",
  },

  {
    id: "indrajit",
    number: "34",
    role: "THE INVINCIBLE WARRIOR",
    name: "INDRAJIT",
    group: "lanka",
    description:
      "Ravana's legendary son, a formidable warrior whose mastery of divine weapons made him one of Lanka's greatest champions.",
    image: "/images/characters/indrajit.jpg",
  },

  {
    id: "mandodari",
    number: "35",
    role: "THE QUEEN OF LANKA",
    name: "MANDODARI",
    group: "lanka",
    description:
      "The wise queen of Lanka whose counsel repeatedly warned Ravana against the path that would bring ruin to his kingdom.",
    image: "/images/characters/mandodari.jpg",
  },

  {
    id: "surpanakha",
    number: "36",
    role: "THE PROVOCATEUR",
    name: "SURPANAKHA",
    group: "lanka",
    description:
      "Ravana's sister whose encounter with Rama and Lakshmana became one of the sparks leading toward the conflict with Lanka.",
    image: "/images/characters/surpanakha.jpg",
  },

  {
    id: "khara",
    number: "37",
    role: "THE RAKSHASA COMMANDER",
    name: "KHARA",
    group: "lanka",
    description:
      "A powerful Rakshasa commander who ruled the wilderness of Janasthana and challenged Rama's presence there.",
    image: "/images/characters/khara.jpg",
  },

  {
    id: "dushana",
    number: "38",
    role: "THE FIERCE WARRIOR",
    name: "DUSHANA",
    group: "lanka",
    description:
      "A fierce Rakshasa warrior and commander who served alongside Khara in the forests of Janasthana.",
    image: "/images/characters/dushana.jpg",
  },

  {
    id: "maricha",
    number: "39",
    role: "THE MASTER OF ILLUSION",
    name: "MARICHA",
    group: "lanka",
    description:
      "A skilled Rakshasa illusionist whose transformation into the golden deer became central to Sita's abduction.",
    image: "/images/characters/maricha.jpg",
  },

  {
    id: "subahu",
    number: "40",
    role: "THE RAKSHASA WARRIOR",
    name: "SUBAHU",
    group: "lanka",
    description:
      "A fierce Rakshasa who disrupted the sacred rites of sages and became one of Rama's early opponents.",
    image: "/images/characters/subahu.jpg",
  },
];


/* =========================================================
   CHARACTER GROUPS
========================================================= */

const characterGroups = [
  {
    id: "ayodhya",
    title: "AYODHYA",
    subtitle: "THE HOUSE OF RAGHU",
  },

  {
    id: "mithila",
    title: "MITHILA",
    subtitle: "THE HOUSE OF JANAKA",
  },

  {
    id: "sages",
    title: "SAGES & GUIDES",
    subtitle: "THE VOICES OF DHARMA",
  },

  {
    id: "kishkindha",
    title: "KISHKINDHA & ALLIES",
    subtitle: "THE VANARA WARRIORS",
  },

  {
    id: "lanka",
    title: "LANKA",
    subtitle: "THE RAKSHASA REALM",
  },
];


/* =========================================================
   COMPONENT
========================================================= */

function RamayanaCharacters() {
  return (
    <main className="ramayana-characters-page">

      {/* =====================================================
          ATMOSPHERE
      ===================================================== */}

      <div className="ramayana-characters-page__atmosphere" />


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="ramayana-characters-nav">

        <Link
          to="/journey/ramayana"
          className="ramayana-characters-nav__back"
        >
          <ArrowLeft size={16} />

          <span>
            BACK TO RAMAYANA
          </span>
        </Link>


        <div className="ramayana-characters-nav__brand">
          ANCESTRA
        </div>


        <div className="ramayana-characters-nav__label">
          THE PEOPLE
        </div>

      </nav>


      {/* =====================================================
          INTRO
      ===================================================== */}

      <section className="ramayana-characters-intro">

        <motion.span
          className="ramayana-characters-intro__eyebrow"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
          }}
        >
          THE PEOPLE OF THE EPIC
        </motion.span>


        <motion.h1
          initial={{
            opacity: 0,
            y: 60,
            filter: "blur(12px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0)",
          }}
          transition={{
            duration: 1.3,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          MEET THE

          <span>
            CHARACTERS
          </span>
        </motion.h1>


        <motion.div
          className="ramayana-characters-intro__line"
          initial={{
            scaleX: 0,
          }}
          animate={{
            scaleX: 1,
          }}
          transition={{
            duration: 1.2,
            delay: 0.5,
          }}
        />


        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 1,
            delay: 0.8,
          }}
        >
          Kings, queens, warriors, sages, devotees and rivals.

          <br />

          Every destiny in the Ramayana begins with a person.
        </motion.p>

      </section>


      {/* =====================================================
          CHARACTER GROUPS
      ===================================================== */}

      <section className="ramayana-characters-groups">

        {characterGroups.map((group) => {

          const groupCharacters = characters.filter(
            (character) =>
              character.group === group.id
          );


          return (

            <section
              key={group.id}
              className={`ramayana-character-group ramayana-character-group--${group.id}`}
            >

              {/* GROUP HEADER */}

              <div className="ramayana-character-group__header">

                <div className="ramayana-character-group__heading">

                  <span className="ramayana-character-group__subtitle">
                    {group.subtitle}
                  </span>

                  <h2>
                    {group.title}
                  </h2>

                </div>


                <span className="ramayana-character-group__count">
                  {String(groupCharacters.length).padStart(2, "0")}
                  {" "}
                  CHARACTERS
                </span>

              </div>


              {/* GROUP LINE */}

              <div className="ramayana-character-group__line" />


              {/* CARDS */}

              <div className="ramayana-characters-grid">

                {groupCharacters.map(
                  (character, index) => (

                    <motion.div
                      key={character.id}
                      initial={{
                        opacity: 0,
                        y: 70,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                        amount: 0.12,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: index * 0.06,
                      }}
                    >

                      <Link
                        to={`/journey/ramayana/characters/${character.id}`}
                        className="ramayana-character-card"
                      >

                        {/* IMAGE */}

                        <div className="ramayana-character-card__visual">

                          <img
                            src={character.image}
                            alt=""
                            className="ramayana-character-card__blur"
                            aria-hidden="true"
                          />


                          <div className="ramayana-character-card__image-frame">

                            <img
                              src={character.image}
                              alt={character.name}
                              className="ramayana-character-card__image"
                            />

                          </div>


                          <div className="ramayana-character-card__image-shade" />


                          <span className="ramayana-character-card__number">
                            {character.number}
                          </span>

                        </div>


                        {/* CONTENT */}

                        <div className="ramayana-character-card__content">

                          <span className="ramayana-character-card__role">
                            {character.role}
                          </span>


                          <h2>
                            {character.name}
                          </h2>


                          <div className="ramayana-character-card__rule" />


                          <p>
                            {character.description}
                          </p>


                          <div className="ramayana-character-card__footer">

                            <span>
                              EXPLORE CHARACTER
                            </span>

                            <ArrowRight
                              size={17}
                              strokeWidth={1.2}
                            />

                          </div>

                        </div>

                      </Link>

                    </motion.div>

                  )
                )}

              </div>

            </section>

          );

        })}

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="ramayana-characters-footer">

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

export default RamayanaCharacters;