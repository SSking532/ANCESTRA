import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import "./Characters.css";

const characters = [
  {
    id: "karna",
  
    role: "THE SECRET HIER",
    name: "KARNA",
    group: "warriors",
    description:
      "A warrior whose life was shaped by loyalty, identity, honor and fate.",
    image: "/images/characters/karna.jpg",
  },

  {
    id: "krishna",
    
    role: "THE GUIDE",
    name: "KRISHNA",
    group: "yadava",
    description:
      "The guide whose wisdom, strategy and counsel shaped the course of the epic.",
    image: "/images/characters/krishna.jpg",
  },

  {
    id: "arjuna",
   
    role: "THE ARCHER",
    name: "ARJUNA",
    group: "pandava",
    description:
      "A legendary archer caught between duty, family, friendship and conscience.",
    image: "/images/characters/arjuna.jpg",
  },

  {
    id: "duryodhan",
   
    role: "THE PRINCE",
    name: "DURYODHAN",
    group: "kuru",
    description:
      "The Kuru prince whose ambition, pride and loyalty shaped the path toward war.",
    image: "/images/characters/duryodhana.jpg",
  },

  {
    id: "draupadi",
   
    role: "THE QUEEN",
    name: "DRAUPADI",
    group: "panchala",
    description:
      "A powerful queen whose dignity, resilience and choices became central to the epic.",
    image: "/images/characters/draupadi.jpg",
  },

  {
    id: "bhishma",
   
    role: "THE ELDER",
    name: "BHISHMA",
    group: "kuru",
    description:
      "The great guardian of the Kuru dynasty, bound by a vow that shaped generations.",
    image: "/images/characters/bhishma.jpg",
  },

  {
    id: "yudhisthira",
    
    role: "THE KING",
    name: "YUDHISHTHIRA",
    group: "pandava",
    description:
      "The eldest Pandava, guided by truth, duty and an unwavering pursuit of righteousness.",
    image: "/images/characters/yudhishthira.jpg",
  },

  {
    id: "bhima",
    
    role: "THE FORCE",
    name: "BHIMA",
    group: "pandava",
    description:
      "The mighty Pandava whose immense strength was matched by fierce loyalty and courage.",
    image: "/images/characters/bhima.jpg",
  },

  {
    id: "nakul",
   
    role: "THE GRACEFUL",
    name: "NAKULA",
    group: "pandava",
    description:
      "The elegant Pandava warrior, known for his beauty, skill with weapons and quiet discipline.",
    image: "/images/characters/nakula.jpg",
  },

  {
    id: "sahadeva",
  
    role: "THE SEER",
    name: "SAHADEVA",
    group: "pandava",
    description:
      "The youngest Pandava, gifted with remarkable knowledge, wisdom and insight into destiny.",
    image: "/images/characters/sahadeva.jpg",
  },

  {
    id: "gandhari",
   
    role: "THE MATRIARCH",
    name: "GANDHARI",
    group: "kuru",
    description:
      "The queen of Hastinapura whose devotion, sacrifice and grief witnessed the fall of a dynasty.",
    image: "/images/characters/gandhari.jpg",
  },

  {
    id: "dhritarashtra",
  
    role: "THE BLIND KING",
    name: "DHRITARASHTRA",
    group: "kuru",
    description:
      "The blind king of Hastinapura whose love for his sons conflicted with his duty as ruler.",
    image: "/images/characters/dhritarashtra.jpg",
  },

  {
    id: "shakuni",
   
    role: "THE MANIPULATOR",
    name: "SHAKUNI",
    group: "kuru",
    description:
      "The cunning prince whose patience, deception and political manipulation helped drive the Kuru dynasty toward ruin.",
    image: "/images/characters/shakuni.jpg",
  },

  {
    id: "dronacharya",
    
    role: "THE TEACHER",
    name: "DRONACHARYA",
    group: "warriors",
    description:
      "The legendary master of warfare who trained princes and warriors while carrying the weight of duty and loyalty.",
    image: "/images/characters/dronacharya.jpg",
  },

  {
    id: "ashwatthama",
   
    role: "THE WARRIOR",
    name: "ASHWATTHAMA",
    group: "warriors",
    description:
      "The fierce son of Dronacharya, a formidable warrior driven by loyalty, rage and an unrelenting sense of vengeance.",
    image: "/images/characters/ashwatthama.jpg",
  },

  {
    id: "abhimanyu",
 
    role: "THE YOUNG WARRIOR",
    name: "ABHIMANYU",
    group: "pandava",
    description:
      "A brilliant young warrior whose courage and sacrifice became one of the epic's most enduring tragedies.",
    image: "/images/characters/abhimanyu.jpg",
  },

  {
    id: "ghatotkacha",
    
    role: "THE GIANT",
    name: "GHATOTKACHA",
    group: "warriors",
    description:
      "The mighty son of Bhima, a powerful warrior whose extraordinary strength became crucial in the great war.",
    image: "/images/characters/ghatotkacha.jpg",
  },

  {
    id: "vidura",
   
    role: "THE COUNSELOR",
    name: "VIDURA",
    group: "kuru",
    description:
      "The wise counselor of Hastinapura, guided by morality, wisdom and the courage to speak the truth.",
    image: "/images/characters/vidura.jpg",
  },

  {
    id: "balaram",
    
    role: "THE ELDER WARRIOR",
    name: "BALARAMA",
    group: "yadava",
    description:
      "The powerful elder of the Yadava dynasty, known for his strength, discipline and formidable warrior prowess.",
    image: "/images/characters/balram.jpg",
  },

  {
    id: "pandu",
    
    role: "THE KING",
    name: "PANDU",
    group: "pandava",
    description:
      "The former king of Hastinapura and father of the Pandavas, whose fate shaped the next generation of the Kuru dynasty.",
    image: "/images/characters/pandu.jpg",
  },

  {
    id: "kunti",
    
    role: "THE MOTHER",
    name: "KUNTI",
    group: "pandava",
    description:
      "The mother of the Pandavas, whose extraordinary choices, strength and hidden past profoundly shaped the epic.",
    image: "/images/characters/kunti.jpg",
  },

  {
    id: "madri",
   
    role: "THE QUEEN",
    name: "MADRI",
    group: "pandava",
    description:
      "The second queen of Pandu and mother of Nakula and Sahadeva, whose life became intertwined with the fate of the Pandava family.",
    image: "/images/characters/madri.jpg",
  },

  {
    id: "shantanu",
   
    role: "THE KING",
    name: "SHANTANU",
    group: "legacy",
    description:
      "The Kuru king whose relationships with Ganga and Satyavati shaped the lineage and future of the dynasty.",
    image: "/images/characters/shantanu.jpg",
  },

  {
    id: "satyavati",
    
    role: "THE MATRIARCH",
    name: "SATYAVATI",
    group: "legacy",
    description:
      "The powerful queen whose ambitions, decisions and lineage played a decisive role in the succession of the Kuru dynasty.",
    image: "/images/characters/satyavati.jpg",
  },

  {
    id: "amba",
    
    role: "THE AVENGER",
    name: "AMBA",
    group: "legacy",
    description:
      "The princess whose humiliation and determination for vengeance became deeply connected to the destiny of Bhishma.",
    image: "/images/characters/amba.jpg",
  },

  {
    id: "dushasana",
   
    role: "THE KURU PRINCE",
    name: "DUSHASANA",
    group: "kuru",
    description:
      "Duryodhana's fierce younger brother and one of his closest allies throughout the struggle for the Kuru throne.",
    image: "/images/characters/dushasana.jpg",
  },

  {
    id: "vikarna",
   
    role: "THE HONORABLE KURU",
    name: "VIKARNA",
    group: "kuru",
    description:
      "One of the Kaurava brothers remembered for his willingness to question injustice even within his own family.",
    image: "/images/characters/vikarna.jpg",
  },

  {
    id: "jayadratha",
   
    role: "THE KING",
    name: "JAYADRATHA",
    group: "warriors",
    description:
      "The king of Sindhu and an important Kaurava ally whose actions became crucial during the great war.",
    image: "/images/characters/jayadratha.jpg",
  },

  {
    id: "kripacharya",
   
    role: "THE ACHARYA",
    name: "KRIPACHARYA",
    group: "warriors",
    description:
      "An accomplished warrior and teacher who remained connected to the Kuru court across generations of conflict.",
    image: "/images/characters/kripacharya.jpg",
  },

  {
    id: "subhadra",
    
    role: "THE YADAVA PRINCESS",
    name: "SUBHADRA",
    group: "yadava",
    description:
      "The courageous Yadava princess, beloved sister of Krishna, wife of Arjuna, and mother of the legendary warrior Abhimanyu.",
    image: "/images/characters/subhadra.jpg",
  },

  {
    id: "drupada",
   
    role: "THE KING",
    name: "DRUPADA",
    group: "panchala",
    description:
      "The powerful king of Panchala and father of Draupadi and Dhrishtadyumna, whose rivalry with Drona shaped his destiny.",
    image: "/images/characters/drupada.jpg",
  },

  {
    id: "dhrishtadyumna",
    
    role: "THE COMMANDER",
    name: "DHRISHTADYUMNA",
    group: "panchala",
    description:
      "The son of Drupada, brother of Draupadi and commander of the Pandava forces during the Kurukshetra war.",
    image: "/images/characters/dhrishtadyumna.jpg",
  },

  { 
  id: "ambika", 
  role: "THE KURU QUEEN", 
  name: "AMBIKA", 
  group: "legacy", 
  description: 
    "The princess of Kashi who became queen of the Kuru dynasty and mother of Dhritarashtra through the sacred niyoga tradition.", 
  image: "/images/characters/ambika.jpg", 
},

{ 
  id: "ambalika", 
  role: "THE KURU QUEEN", 
  name: "AMBALIKA", 
  group: "legacy", 
  description: 
    "The princess of Kashi who became queen of the Kuru dynasty and mother of Pandu through the sacred niyoga tradition.", 
  image: "/images/characters/ambalika.jpg", 
},

{ 
  id: "chitrangada", 
  role: "THE WARRIOR KING", 
  name: "CHITRANGADA", 
  group: "legacy", 
  description: 
    "The elder son of King Shantanu and Satyavati who became an early king of the Kuru dynasty and was renowned as a formidable warrior.", 
  image: "/images/characters/chitrangada.jpg", 
},

{ 
  id: "vichitravirya", 
  role: "THE YOUNG KING", 
  name: "VICHITRAVIRYA", 
  group: "legacy", 
  description: 
    "The younger son of Shantanu and Satyavati who became king of the Kurus and husband of the Kashi princesses Ambika and Ambalika.", 
  image: "/images/characters/vichitravirya.jpg", 
},

  {
    id: "shikhandi",
    
    role: "THE WARRIOR OF DESTINY",
    name: "SHIKHANDI",
    group: "panchala",
    description:
      "A determined warrior whose extraordinary story became inseparably connected with the fall of Bhishma.",
    image: "/images/characters/shikhandi.jpg",
  },

  {
    id: "uttara",
   
    role: "THE PRINCESS",
    name: "UTTARA",
    group: "legacy",
    description:
      "The princess of Matsya and wife of Abhimanyu, whose family became part of the surviving Kuru lineage.",
    image: "/images/characters/uttara.jpg",
  },

  {
    id: "parikshit",
   
    role: "THE HEIR",
    name: "PARIKSHIT",
    group: "pandava",
    description:
      "The heir who survived the destruction of the Kuru generation and carried the dynasty into its next chapter.",
    image: "/images/characters/parikshit.jpg",
  },

  {
    id: "ganga",
   
    role: "THE DIVINE MOTHER",
    name: "GANGA",
    group: "legacy",
    description:
      "The divine mother of Bhishma whose union with Shantanu became one of the foundational stories of the Kuru dynasty.",
    image: "/images/characters/ganga.jpg",
  },
];

const characterGroups = [
  {
    id: "pandava",
    title: "PANDAVA DYNASTY",
    subtitle: "THE HOUSE OF GOD SONS",
  },
  {
    id: "kuru",
    title: "KURU DYNASTY",
    subtitle: "THE HOUSE OF HASTINAPURA",
  },
  {
    id: "warriors",
    title: "WARRIORS & TEACHERS",
    subtitle: "THE MASTERS OF WAR",
  },
  {
    id: "yadava",
    title: "YADAVA DYNASTY",
    subtitle: "THE HOUSE OF DWARAKA",
  },
  {
    id: "panchala",
    title: "PANCHALA",
    subtitle: "THE HOUSE OF DRUPADA",
  },
  {
    id: "legacy",
    title: "ANCESTRAL LEGACY",
    subtitle: "THE ROOTS & HEIRS",
  },
];

function Characters() {
  return (
    <main className="characters-page">

      {/* BACKGROUND ATMOSPHERE */}
      <div className="characters-page__atmosphere" />

      {/* NAVIGATION */}
      <nav className="characters-nav">
        <Link to="/journey/mahabharata" className="characters-nav__back">
          <ArrowLeft size={16} />
          <span>BACK TO MAHABHARATA</span>
        </Link>

        <div className="characters-nav__brand">
          ANCESTRA
        </div>

        <div className="characters-nav__label">
          THE PEOPLE
        </div>
      </nav>

      {/* INTRO */}
      <section className="characters-intro">

        <motion.span
          className="characters-intro__eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          THE PEOPLE
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
          <span>CHARACTERS</span>
        </motion.h1>

        <motion.div
          className="characters-intro__line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          Kings, warriors, queens, teachers, brothers, friends and rivals.
          <br />
          Every choice in the epic begins with a person.
        </motion.p>

      </section>

{/* CHARACTER GROUPS */}
<section className="characters-groups">

  {characterGroups.map((group) => {

    const groupCharacters = characters.filter(
      (character) => character.group === group.id
    );

    return (
      <section
        key={group.id}
        className={`character-group character-group--${group.id}`}
      >

        {/* GROUP HEADER */}
        <div className="character-group__header">

          <div className="character-group__heading">

            <span className="character-group__subtitle">
              {group.subtitle}
            </span>

            <h2>{group.title}</h2>

          </div>

          <span className="character-group__count">
            {String(groupCharacters.length).padStart(2, "0")} CHARACTERS
          </span>

        </div>

        {/* GROUP LINE */}
        <div className="character-group__line" />

        {/* CARDS */}
        <div className="characters-grid">

          {groupCharacters.map((character, index) => (

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
                to={`/journey/mahabharata/characters/${character.id}`}
                className="character-card"
              >

                {/* IMAGE */}
                <div className="character-card__visual">

                  <img
                    src={character.image}
                    alt={character.name}
                    className="character-card__blur"
                  />

                  <div className="character-card__image-frame">

                    <img
                      src={character.image}
                      alt={character.name}
                      className="character-card__image"
                    />

                  </div>

                  <div className="character-card__image-shade" />

                  <span className="character-card__number">
                    {character.number}
                  </span>

                </div>

                {/* CONTENT */}
                <div className="character-card__content">

                  <span className="character-card__role">
                    {character.role}
                  </span>

                  <h2>{character.name}</h2>

                  <div className="character-card__rule" />

                  <p>{character.description}</p>

                  <div className="character-card__footer">

                    <span>EXPLORE CHARACTER</span>

                    <ArrowRight
                      size={17}
                      strokeWidth={1.2}
                    />

                  </div>

                </div>

              </Link>

            </motion.div>

          ))}

        </div>

      </section>
    );
  })}

</section>

      {/* FOOTER */}
      <footer className="characters-footer">

        <span>ANCESTRA</span>

        <span>MAHABHARATA</span>

        <span>
          THE PAST CANNOT BE CHANGED
        </span>

      </footer>

    </main>
  );
}

export default Characters;