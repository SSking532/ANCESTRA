import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDown,
  Sparkles,
  Crown,
  Shield,
  ScrollText,
  Users,
  Swords,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import "./CharacterDetail.css";

const characters = {
  // =========================================================
  // 01 — KARNA
  // =========================================================

  karna: {
    name: "KARNA",
    title: "THE WARRIOR",
    subtitle: "A life shaped by loyalty, identity, honor and fate.",
    intro:
      "Karna stands as one of the epic's most complex figures — a warrior whose extraordinary abilities were constantly challenged by questions of identity, belonging and loyalty.",
    nature:
      "Proud, generous, fiercely loyal and deeply resilient. Karna's choices are often driven by gratitude and the desire to prove his worth.",
    strengths:
      "Exceptional warrior, extraordinary archer, unwavering loyalty and remarkable generosity.",
    role: "Warrior • King • Archer",
    affiliation: "Anga",
    symbol: "☼",
    accent: "karna",
    relationships: [
      ["Duryodhana", "Loyal friend and patron"],
      ["Kunti", "Mother"],
      ["Arjuna", "Great rival"],
      ["Krishna", "Truth revealed too late"],
    ],
  },

  // =========================================================
  // 02 — KRISHNA
  // =========================================================

  krishna: {
    name: "KRISHNA",
    title: "THE GUIDE",
    subtitle:
      "The strategist whose wisdom illuminated the battlefield of choice.",
    intro:
      "Krishna stands at the heart of the epic as guide, strategist, diplomat and philosopher. His presence transforms the story from a conflict between kingdoms into a deeper exploration of duty, action and consciousness.",
    nature:
      "Calm, perceptive, strategic, compassionate and profoundly wise.",
    strengths:
      "Wisdom, diplomacy, strategic thinking, emotional insight and the ability to see beyond immediate circumstances.",
    role: "Guide • Strategist • Diplomat",
    affiliation: "Yadava",
    symbol: "✦",
    accent: "krishna",
    relationships: [
      ["Arjuna", "Friend and guide"],
      ["Pandavas", "Strategic ally"],
      ["Duryodhana", "Political counterpart"],
      ["Draupadi", "Trusted ally"],
    ],
  },

  // =========================================================
  // 03 — ARJUNA
  // =========================================================

  arjuna: {
    name: "ARJUNA",
    title: "THE ARCHER",
    subtitle:
      "A legendary warrior caught between duty, family and conscience.",
    intro:
      "Arjuna is one of the central warriors of the Mahabharata. His journey is not simply one of martial excellence, but of confronting doubt, responsibility and the meaning of duty.",
    nature:
      "Focused, disciplined, sensitive, courageous and deeply reflective.",
    strengths:
      "Masterful archery, discipline, concentration, courage and extraordinary battlefield skill.",
    role: "Warrior • Archer • Prince",
    affiliation: "Pandavas",
    symbol: "➶",
    accent: "arjuna",
    relationships: [
      ["Krishna", "Friend and charioteer"],
      ["Draupadi", "Wife"],
      ["Karna", "Great rival"],
      ["Yudhishthira", "Elder brother"],
    ],
  },

  // =========================================================
  // 04 — DURYODHANA
  // =========================================================

  duryodhan: {
    name: "DURYODHANA",
    title: "THE PRINCE",
    subtitle:
      "A prince whose ambition and loyalty helped shape the great conflict.",
    intro:
      "Duryodhana is the eldest Kaurava prince and one of the central forces behind the conflict between the Kauravas and Pandavas. His ambition for the throne is intertwined with pride, resentment and unwavering loyalty toward those closest to him.",
    nature:
      "Ambitious, proud, determined, loyal and deeply competitive.",
    strengths:
      "Political influence, determination, mace fighting, leadership and fierce loyalty.",
    role: "Prince • Warrior • Kaurava Leader",
    affiliation: "Kauravas / Hastinapura",
    symbol: "♜",
    accent: "duryodhana",
    relationships: [
      ["Karna", "Closest friend and ally"],
      ["Dushasana", "Brother"],
      ["Shakuni", "Maternal uncle and advisor"],
      ["Pandavas", "Rivals"],
    ],
  },

  // =========================================================
  // 05 — DRAUPADI
  // =========================================================

  draupadi: {
    name: "DRAUPADI",
    title: "THE QUEEN",
    subtitle:
      "A woman whose dignity, strength and choices echo throughout the epic.",
    intro:
      "Draupadi is one of the central figures of the Mahabharata. Her presence connects questions of dignity, justice, power, loyalty and consequence across the epic.",
    nature:
      "Strong-willed, intelligent, courageous, perceptive and fiercely protective of her dignity.",
    strengths:
      "Resolve, intelligence, emotional strength, political awareness and unwavering courage.",
    role: "Queen • Strategist • Daughter of Panchala",
    affiliation: "Panchala / Pandavas",
    symbol: "✧",
    accent: "draupadi",
    relationships: [
      ["Pandavas", "Husbands"],
      ["Krishna", "Trusted friend"],
      ["Kunti", "Mother-in-law"],
      ["Duryodhana", "Political adversary"],
    ],
  },

  // =========================================================
  // 06 — BHISHMA
  // =========================================================

  bhishma: {
    name: "BHISHMA",
    title: "THE ELDER",
    subtitle:
      "The guardian of a dynasty bound by an extraordinary vow.",
    intro:
      "Bhishma is the great elder of the Kuru dynasty. His life is defined by duty, sacrifice and an oath that shapes generations of the royal family.",
    nature:
      "Disciplined, honorable, steadfast, wise and deeply devoted to duty.",
    strengths:
      "Military mastery, wisdom, discipline, leadership and extraordinary endurance.",
    role: "Elder • Warrior • Guardian",
    affiliation: "Kuru Dynasty",
    symbol: "✦",
    accent: "bhishma",
    relationships: [
      ["Shantanu", "Father"],
      ["Ganga", "Mother"],
      ["Pandavas", "Grandfather"],
      ["Kauravas", "Grandfather"],
    ],
  },

  // =========================================================
  // 07 — YUDHISHTHIRA
  // =========================================================

  yudhisthira: {
    name: "YUDHISHTHIRA",
    title: "THE KING",
    subtitle:
      "The eldest Pandava, guided by truth, duty and the burden of kingship.",
    intro:
      "Yudhishthira is the eldest of the Pandavas and a central embodiment of dharma in the epic. His journey repeatedly places his commitment to truth and duty against the difficult realities of power and war.",
    nature:
      "Truthful, calm, thoughtful, compassionate and deeply committed to dharma.",
    strengths:
      "Judgment, wisdom, diplomacy, patience and moral conviction.",
    role: "King • Prince • Eldest Pandava",
    affiliation: "Pandavas / Hastinapura",
    symbol: "♛",
    accent: "yudhishthira",
    relationships: [
      ["Kunti", "Mother"],
      ["Bhima", "Younger brother"],
      ["Arjuna", "Younger brother"],
      ["Draupadi", "Wife"],
    ],
  },

  // =========================================================
  // 08 — BHIMA
  // =========================================================

  bhima: {
    name: "BHIMA",
    title: "THE MIGHTY",
    subtitle:
      "The powerful Pandava whose strength was matched by fierce loyalty.",
    intro:
      "Bhima is the second Pandava and one of the epic's greatest warriors. Known for immense physical strength, he is also fiercely protective of his family and deeply committed to justice.",
    nature:
      "Fearless, passionate, loyal, direct and fiercely protective.",
    strengths:
      "Extraordinary physical strength, mace fighting, courage, endurance and battlefield power.",
    role: "Warrior • Prince • Pandava",
    affiliation: "Pandavas",
    symbol: "⚔",
    accent: "bhima",
    relationships: [
      ["Yudhishthira", "Elder brother"],
      ["Arjuna", "Brother"],
      ["Draupadi", "Wife"],
      ["Duryodhana", "Great rival"],
    ],
  },

  // =========================================================
  // 09 — NAKULA
  // =========================================================

  nakul: {
    name: "NAKULA",
    title: "THE SWORDSMAN",
    subtitle:
      "The graceful Pandava known for skill, discipline and quiet strength.",
    intro:
      "Nakula is one of the twin Pandavas, born to Madri. He is renowned for his beauty, skill with weapons and exceptional knowledge of horses.",
    nature:
      "Graceful, disciplined, loyal, composed and thoughtful.",
    strengths:
      "Swordsmanship, horsemanship, physical ability and disciplined combat.",
    role: "Prince • Warrior • Horseman",
    affiliation: "Pandavas",
    symbol: "⚔",
    accent: "nakula",
    relationships: [
      ["Sahadeva", "Twin brother"],
      ["Madri", "Mother"],
      ["Kunti", "Stepmother"],
      ["Pandavas", "Brothers"],
    ],
  },

  // =========================================================
  // 10 — SAHADEVA
  // =========================================================

  sahadeva: {
    name: "SAHADEVA",
    title: "THE WISE ONE",
    subtitle:
      "The youngest Pandava, remembered for intelligence and insight.",
    intro:
      "Sahadeva is the youngest of the Pandavas and twin brother of Nakula. He is associated with wisdom, knowledge and a quiet understanding of events surrounding the epic.",
    nature:
      "Quiet, intelligent, perceptive, loyal and disciplined.",
    strengths:
      "Knowledge, strategic thinking, wisdom, swordsmanship and judgment.",
    role: "Prince • Warrior • Counselor",
    affiliation: "Pandavas",
    symbol: "✦",
    accent: "sahadeva",
    relationships: [
      ["Nakula", "Twin brother"],
      ["Madri", "Mother"],
      ["Kunti", "Stepmother"],
      ["Yudhishthira", "Elder brother"],
    ],
  },

  // =========================================================
  // 11 — GANDHARI
  // =========================================================

  gandhari: {
    name: "GANDHARI",
    title: "THE QUEEN",
    subtitle:
      "A queen whose devotion, grief and moral strength endured a shattered dynasty.",
    intro:
      "Gandhari was the queen of Hastinapura and mother of the Kauravas. Her life reflects devotion, sacrifice and the devastating consequences of the conflict that consumed her family.",
    nature:
      "Devoted, restrained, strong-willed, compassionate and morally perceptive.",
    strengths:
      "Endurance, devotion, moral strength, spiritual discipline and maternal resolve.",
    role: "Queen • Mother • Kuru Matriarch",
    affiliation: "Hastinapura",
    symbol: "✧",
    accent: "gandhari",
    relationships: [
      ["Dhritarashtra", "Husband"],
      ["Duryodhana", "Son"],
      ["Dushasana", "Son"],
      ["Pandavas", "Nephews"],
    ],
  },

  // =========================================================
  // 12 — DHRITARASHTRA
  // =========================================================

  dhritarashtra: {
    name: "DHRITARASHTRA",
    title: "THE KING",
    subtitle:
      "A ruler caught between affection, power and responsibility.",
    intro:
      "Dhritarashtra's position at the center of the Kuru court reveals the difficult relationship between personal attachment and the responsibilities of kingship.",
    nature:
      "Affectionate, conflicted, powerful and deeply influenced by attachment.",
    strengths:
      "Political authority, knowledge of the royal court and understanding of dynastic affairs.",
    role: "King • Father • Kuru Patriarch",
    affiliation: "Hastinapura",
    symbol: "♛",
    accent: "dhritarashtra",
    relationships: [
      ["Gandhari", "Wife"],
      ["Duryodhana", "Son"],
      ["Pandavas", "Nephews"],
      ["Vidura", "Counselor"],
    ],
  },

  // =========================================================
  // 13 — SHAKUNI
  // =========================================================

  shakuni: {
    name: "SHAKUNI",
    title: "THE STRATEGIST",
    subtitle:
      "The master of intrigue whose schemes altered the fate of kingdoms.",
    intro:
      "Shakuni, prince of Gandhara and maternal uncle of Duryodhana, became one of the most influential strategists within the Kaurava camp. His intelligence and manipulation played a major role in escalating the conflict between the two branches of the Kuru family.",
    nature:
      "Cunning, calculating, patient, manipulative and fiercely determined.",
    strengths:
      "Strategy, political manipulation, diplomacy, psychological insight and mastery of the dice game.",
    role: "Prince • Strategist • Advisor",
    affiliation: "Gandhara / Kauravas",
    symbol: "♟",
    accent: "shakuni",
    relationships: [
      ["Duryodhana", "Nephew and ally"],
      ["Gandhari", "Sister"],
      ["Dhritarashtra", "Brother-in-law"],
      ["Yudhishthira", "Opponent in the dice game"],
    ],
  },

  // =========================================================
  // 14 — DRONACHARYA
  // =========================================================

  dronacharya: {
    name: "DRONACHARYA",
    title: "THE TEACHER",
    subtitle:
      "The legendary master whose teachings shaped the greatest warriors of the age.",
    intro:
      "Dronacharya was the royal teacher of the Kuru princes and one of the greatest masters of warfare in the epic. His relationships with his students, especially Arjuna and Ashwatthama, shaped both his life and the war.",
    nature:
      "Disciplined, knowledgeable, ambitious, proud and deeply attached to his son.",
    strengths:
      "Military instruction, archery, strategy, weapons knowledge and battlefield command.",
    role: "Teacher • Warrior • Royal Preceptor",
    affiliation: "Hastinapura",
    symbol: "✦",
    accent: "dronacharya",
    relationships: [
      ["Arjuna", "Favored student"],
      ["Ashwatthama", "Son"],
      ["Duryodhana", "Student"],
      ["Drupada", "Former friend and rival"],
    ],
  },

  // =========================================================
  // 15 — ASHWATTHAMA
  // =========================================================

  ashwatthama: {
    name: "ASHWATTHAMA",
    title: "THE WARRIOR",
    subtitle:
      "The son of Drona whose loyalty and anger carried him beyond the war.",
    intro:
      "Ashwatthama was the son of Dronacharya and a powerful warrior on the Kaurava side. His story is marked by loyalty to his father, fierce anger and the consequences of actions taken after the battlefield conflict.",
    nature:
      "Proud, fierce, loyal, intense and deeply affected by loss.",
    strengths:
      "Martial skill, weapons mastery, endurance, determination and battlefield experience.",
    role: "Warrior • Son of Drona • Kaurava Ally",
    affiliation: "Hastinapura / Kauravas",
    symbol: "⚔",
    accent: "ashwathama",
    relationships: [
      ["Drona", "Father"],
      ["Kripacharya", "Family connection"],
      ["Duryodhana", "Ally"],
      ["Pandavas", "Opponents"],
    ],
  },

  // =========================================================
  // 16 — ABHIMANYU
  // =========================================================

  abhimanyu: {
    name: "ABHIMANYU",
    title: "THE YOUNG WARRIOR",
    subtitle:
      "A brilliant young warrior whose courage became one of the war's enduring memories.",
    intro:
      "Abhimanyu was the son of Arjuna and Subhadra. Though young, he possessed exceptional martial ability and played a memorable role during the Kurukshetra war.",
    nature:
      "Brave, energetic, determined, noble and deeply devoted to his family.",
    strengths:
      "Archery, battlefield courage, tactical ability, determination and exceptional martial skill.",
    role: "Warrior • Prince • Pandava Heir",
    affiliation: "Pandavas / Matsya",
    symbol: "➶",
    accent: "abhimanyu",
    relationships: [
      ["Arjuna", "Father"],
      ["Subhadra", "Mother"],
      ["Krishna", "Maternal uncle"],
      ["Uttara", "Wife"],
    ],
  },

  // =========================================================
  // 17 — GHATOTKACHA
  // =========================================================

  ghatotkacha: {
    name: "GHATOTKACHA",
    title: "THE WARRIOR",
    subtitle:
      "The powerful son of Bhima whose strength transformed the night battle.",
    intro:
      "Ghatotkacha was the son of Bhima and the rakshasi Hidimbi. His extraordinary abilities and command over supernatural warfare made him a formidable ally of the Pandavas.",
    nature:
      "Fearless, loyal, powerful, protective and courageous.",
    strengths:
      "Immense strength, supernatural abilities, battlefield strategy and courage.",
    role: "Warrior • Prince • Son of Bhima",
    affiliation: "Pandavas / Rakshasa lineage",
    symbol: "⚔",
    accent: "ghatotkacha",
    relationships: [
      ["Bhima", "Father"],
      ["Hidimbi", "Mother"],
      ["Pandavas", "Family"],
      ["Karna", "Fated adversary"],
    ],
  },

  // =========================================================
  // 18 — VIDURA
  // =========================================================

  vidura: {
    name: "VIDURA",
    title: "THE COUNSELOR",
    subtitle:
      "The voice of wisdom who repeatedly warned a kingdom approaching disaster.",
    intro:
      "Vidura was one of the wisest counselors of the Kuru court. Known for his understanding of dharma and politics, he repeatedly advised the royal family against destructive decisions.",
    nature:
      "Wise, honest, calm, perceptive and devoted to righteousness.",
    strengths:
      "Political wisdom, diplomacy, ethical judgment, foresight and counsel.",
    role: "Counselor • Statesman • Sage",
    affiliation: "Hastinapura",
    symbol: "✦",
    accent: "vidura",
    relationships: [
      ["Dhritarashtra", "Counselor and brother"],
      ["Pandavas", "Protector and ally"],
      ["Duryodhana", "Advised against his actions"],
      ["Krishna", "Trusted ally"],
    ],
  },

  // =========================================================
  // 19 — BALARAMA
  // =========================================================

  balaram: {
    name: "BALARAMA",
    title: "THE ELDER",
    subtitle:
      "The powerful elder of the Yadavas who chose distance from the great war.",
    intro:
      "Balarama was the elder brother of Krishna and a revered warrior associated with strength and mastery of the mace. His relationship with both the Pandavas and Kauravas placed him in a unique position during the conflict.",
    nature:
      "Strong, straightforward, disciplined, protective and independent-minded.",
    strengths:
      "Immense physical strength, mace fighting, martial knowledge and leadership.",
    role: "Warrior • Elder • Yadava Prince",
    affiliation: "Yadavas / Vrindavan",
    symbol: "⚔",
    accent: "balarama",
    relationships: [
      ["Krishna", "Younger brother"],
      ["Duryodhana", "Mace student"],
      ["Bhima", "Mace student"],
      ["Yadavas", "Elder"],
    ],
  },

  // =========================================================
  // 20 — PANDU
  // =========================================================

  pandu: {
    name: "PANDU",
    title: "THE KING",
    subtitle:
      "The warrior king whose fate shaped the birth of a dynasty.",
    intro:
      "Pandu was a powerful king of the Kuru dynasty whose reign was cut short by a curse. Though unable to father children in the ordinary way, his legacy continued through the Pandavas, whose lives would eventually determine the fate of the Kuru kingdom.",
    nature:
      "Disciplined, courageous, dutiful and deeply conscious of his responsibilities as a king and father.",
    strengths:
      "Military leadership, archery, hunting, royal authority and battlefield courage.",
    role: "King • Warrior • Father",
    affiliation: "Kuru Dynasty",
    symbol: "♛",
    accent: "pandu",
    relationships: [
      ["Kunti", "Wife"],
      ["Madri", "Wife"],
      ["Dhritarashtra", "Elder brother"],
      ["Pandavas", "Sons"],
    ],
  },

  // =========================================================
  // 21 — KUNTI
  // =========================================================

  kunti: {
    name: "KUNTI",
    title: "THE QUEEN",
    subtitle:
      "A queen, mother and survivor whose choices shaped generations.",
    intro:
      "Kunti stands at the heart of the Pandava story. Her life carries secrets, sacrifice and extraordinary responsibility, from the birth of Karna to the raising of the Pandavas through exile, hardship and war.",
    nature:
      "Resilient, intelligent, composed, courageous and fiercely protective of her children.",
    strengths:
      "Emotional resilience, wisdom, political awareness, endurance and remarkable strength of character.",
    role: "Queen • Mother • Matriarch",
    affiliation: "Kuru Dynasty / Pandavas",
    symbol: "✧",
    accent: "kunti",
    relationships: [
      ["Pandu", "Husband"],
      ["Karna", "Firstborn son"],
      ["Pandavas", "Sons"],
      ["Draupadi", "Daughter-in-law"],
    ],
  },

  // =========================================================
  // 22 — MADRI
  // =========================================================

  madri: {
    name: "MADRI",
    title: "THE QUEEN",
    subtitle:
      "The princess of Madra whose brief life became part of the Pandava legacy.",
    intro:
      "Madri was the princess of Madra and the second wife of King Pandu. Through her sons Nakula and Sahadeva, she became an important part of the lineage that would later shape the great conflict of the Mahabharata.",
    nature:
      "Graceful, affectionate, devoted and deeply conscious of her family.",
    strengths:
      "Grace, devotion, courage and dedication to her children and husband.",
    role: "Queen • Mother • Princess of Madra",
    affiliation: "Madra / Kuru Dynasty",
    symbol: "✦",
    accent: "madri",
    relationships: [
      ["Pandu", "Husband"],
      ["Kunti", "Co-wife"],
      ["Nakula", "Son"],
      ["Sahadeva", "Son"],
    ],
  },

  // =========================================================
  // 23 — SHANTANU
  // =========================================================

  shantanu: {
    name: "SHANTANU",
    title: "THE KING",
    subtitle:
      "The Kuru king whose choices changed the course of his dynasty.",
    intro:
      "Shantanu was a powerful king of the Kuru dynasty whose marriages and decisions became central to the lineage of Hastinapura. His relationship with Ganga and later with Satyavati shaped the succession of the kingdom for generations.",
    nature:
      "Noble, authoritative, compassionate and deeply influenced by love and personal desire.",
    strengths:
      "Kingship, military authority, leadership and devotion to his family.",
    role: "King • Kuru Ruler • Patriarch",
    affiliation: "Kuru Dynasty / Hastinapura",
    symbol: "♛",
    accent: "shantanu",
    relationships: [
      ["Ganga", "First wife"],
      ["Satyavati", "Second wife"],
      ["Bhishma", "Son"],
      ["Vichitravirya", "Son"],
    ],
  },

  // =========================================================
  // 24 — SATYAVATI
  // =========================================================

  satyavati: {
    name: "SATYAVATI",
    title: "THE QUEEN",
    subtitle:
      "The queen whose ambition and lineage transformed the Kuru throne.",
    intro:
      "Satyavati rose from humble beginnings to become queen of Hastinapura. Her determination to secure the future of her lineage had consequences that extended far beyond her own lifetime and deeply influenced the succession of the Kuru dynasty.",
    nature:
      "Determined, intelligent, ambitious, politically aware and fiercely protective of her lineage.",
    strengths:
      "Political intelligence, determination, negotiation and powerful influence over the royal succession.",
    role: "Queen • Matriarch • Dynastic Figure",
    affiliation: "Kuru Dynasty / Hastinapura",
    symbol: "♛",
    accent: "satyavati",
    relationships: [
      ["Shantanu", "Husband"],
      ["Bhishma", "Stepson"],
      ["Vyasa", "Son"],
      ["Vichitravirya", "Son"],
    ],
  },

  // =========================================================
  // 25 — AMBA
  // =========================================================

  amba: {
    name: "AMBA",
    title: "THE PRINCESS",
    subtitle:
      "A princess whose quest for justice became a force of destiny.",
    intro:
      "Amba's story is one of the most powerful journeys of grievance and determination in the epic. After her life is disrupted by Bhishma's actions, her resolve becomes inseparable from her desire to confront the warrior she holds responsible.",
    nature:
      "Determined, passionate, proud and relentless in her pursuit of justice.",
    strengths:
      "Unbreakable resolve, courage, determination and extraordinary persistence.",
    role: "Princess • Challenger • Figure of Destiny",
    affiliation: "Kashi",
    symbol: "✦",
    accent: "amba",
    relationships: [
      ["Bhishma", "Central adversary"],
      ["Shikhandi", "Later incarnation"],
      ["Kashi", "Princess"],
      ["Shantanu's Dynasty", "Fateful connection"],
    ],
  },

  // =========================================================
  // 26 — DUSHASANA
  // =========================================================

  dushasana: {
    name: "DUSHASANA",
    title: "THE PRINCE",
    subtitle:
      "A powerful Kaurava prince whose loyalty follows his brother.",
    intro:
      "Dushasana is one of Duryodhana's closest allies and a prominent figure among the Kaurava princes.",
    nature:
      "Fierce, loyal, aggressive and deeply committed to his brother.",
    strengths:
      "Physical strength, battlefield ability and unwavering allegiance.",
    role: "Prince • Warrior • Kaurava",
    affiliation: "Kauravas",
    symbol: "⚔",
    accent: "dushasana",
    relationships: [
      ["Duryodhana", "Brother"],
      ["Dhritarashtra", "Father"],
      ["Gandhari", "Mother"],
      ["Pandavas", "Rivals"],
    ],
  },

  // =========================================================
  // 27 — VIKARNA
  // =========================================================

  vikarna: {
    name: "VIKARNA",
    title: "THE PRINCE",
    subtitle:
      "A Kaurava prince who dared to question the actions of his own side.",
    intro:
      "Vikarna was one of the sons of Dhritarashtra and a Kaurava prince. Unlike many around him, he openly questioned the treatment of Draupadi during the dice hall episode, revealing a moral awareness that placed him in conflict with his own family's actions.",
    nature:
      "Honest, courageous, thoughtful, loyal and morally conflicted.",
    strengths:
      "Moral courage, battlefield ability, loyalty and willingness to speak against injustice.",
    role: "Prince • Warrior • Kaurava",
    affiliation: "Kauravas / Hastinapura",
    symbol: "⚔",
    accent: "vikarna",
    relationships: [
      ["Duryodhana", "Brother"],
      ["Dushasana", "Brother"],
      ["Dhritarashtra", "Father"],
      ["Gandhari", "Mother"],
    ],
  },

  // =========================================================
  // 28 — JAYADRATHA
  // =========================================================

  jayadratha: {
    name: "JAYADRATHA",
    title: "THE KING",
    subtitle:
      "The ruler of Sindhu whose choices brought him into the heart of the war.",
    intro:
      "Jayadratha was the king of Sindhu and husband of Dushala, sister of the Kauravas. His actions against Draupadi and later his role in the Kurukshetra war placed him directly against the Pandavas.",
    nature:
      "Proud, ambitious, determined and fiercely conscious of his royal status.",
    strengths:
      "Warrior skill, political position, determination and battlefield resilience.",
    role: "King • Warrior • Sindhu Ruler",
    affiliation: "Sindhu",
    symbol: "⚔",
    accent: "jayadratha",
    relationships: [
      ["Dushala", "Wife"],
      ["Duryodhana", "Brother-in-law"],
      ["Draupadi", "Adversary"],
      ["Arjuna", "Great adversary"],
    ],
  },

  // =========================================================
  // 29 — KRIPACHARYA
  // =========================================================

  kripacharya: {
    name: "KRIPACHARYA",
    title: "THE TEACHER",
    subtitle:
      "The master of warfare who survived the fall of the Kuru world.",
    intro:
      "Kripacharya was one of the respected teachers and warriors of the Kuru kingdom. He instructed generations of princes and remained connected to the royal court through both peace and war.",
    nature:
      "Disciplined, composed, knowledgeable, restrained and devoted to his responsibilities.",
    strengths:
      "Military knowledge, archery, instruction, wisdom and battlefield experience.",
    role: "Teacher • Warrior • Royal Preceptor",
    affiliation: "Hastinapura",
    symbol: "✦",
    accent: "kripacharya",
    relationships: [
      ["Drona", "Brother-in-law"],
      ["Ashwatthama", "Family connection"],
      ["Kuru Princes", "Teacher"],
      ["Hastinapura", "Royal preceptor"],
    ],
  },

// =========================================================
// 30 — SUBHADRA
// =========================================================

subhadra: {
  name: "SUBHADRA",
  title: "THE YADAVA PRINCESS",
  subtitle:
    "The courageous Yadava princess, beloved sister of Krishna and wife of Arjuna.",

  intro:
    "Subhadra was a princess of the Yadava clan, the beloved sister of Krishna and Balarama, and the wife of Arjuna. Known for her courage, intelligence and devotion, she became an important figure connecting the Yadavas and the Pandavas. She was also the mother of Abhimanyu, one of the most celebrated young warriors of the Mahabharata.",

  nature:
    "Courageous, intelligent, compassionate, devoted, determined and quietly strong.",

  strengths:
    "Courage, wisdom, loyalty, emotional strength, royal dignity and unwavering devotion to her family.",

  role: "Yadava Princess • Wife of Arjuna • Mother of Abhimanyu",

  affiliation: "Yadavas / Vrishnis",

  symbol: "✦",

  accent: "subhadra",

  relationships: [
    ["Krishna", "Beloved brother and protector"],
    ["Balarama", "Brother"],
    ["Arjuna", "Husband"],
    ["Abhimanyu", "Son"],
    ["Pandavas", "Family and allies"],
  ],
},
    // =========================================================
// 31 — AMBIKA
// =========================================================

ambika: {

  name: "AMBIKA",

  title: "THE KURU QUEEN",

  subtitle:
    "The princess of Kashi who became queen of the Kuru dynasty and mother of Dhritarashtra.",

  intro:
    "Ambika was a princess of Kashi who, along with her sister Ambalika, was brought to Hastinapura by Bhishma and married to Vichitravirya. After Vichitravirya's death, she became part of the succession crisis of the Kuru dynasty. Through the ancient niyoga tradition involving the sage Vyasa, she became the mother of Dhritarashtra, who would later become the father of the Kauravas.",

  nature:
    "Dignified, reserved, intelligent, emotionally restrained, resilient and quietly strong.",

  strengths:
    "Royal dignity, emotional endurance, composure, familial loyalty and inner resilience.",

  role: "Princess of Kashi • Queen of Hastinapura • Mother of Dhritarashtra",

  affiliation: "Kashi / Kuru Dynasty",

  symbol: "✦",

  accent: "ambika",

  relationships: [
    ["Ambalika", "Younger sister and fellow Kuru queen"],
    ["Vichitravirya", "Husband"],
    ["Bhishma", "Brother-in-law and protector of the Kuru dynasty"],
    ["Vyasa", "Father of Dhritarashtra through niyoga"],
    ["Dhritarashtra", "Son"],
    ["Kuru Dynasty", "Royal family"],
  ],

},

// =========================================================
// 32 — AMBALIKA
// =========================================================

ambalika: {

  name: "AMBALIKA",

  title: "THE KURU QUEEN",

  subtitle:
    "The princess of Kashi who became queen of the Kuru dynasty and mother of Pandu.",

  intro:
    "Ambalika was a princess of Kashi and the younger sister of Ambika. She was brought to Hastinapura by Bhishma and married to Vichitravirya alongside her sister. Following Vichitravirya's death, she became part of the Kuru succession through the ancient niyoga tradition. Her union with the sage Vyasa resulted in the birth of Pandu, who would become the father of the Pandavas.",

  nature:
    "Graceful, serene, compassionate, perceptive, dignified and quietly courageous.",

  strengths:
    "Emotional resilience, grace, maternal strength, royal dignity, compassion and endurance.",

  role: "Princess of Kashi • Queen of Hastinapura • Mother of Pandu",

  affiliation: "Kashi / Kuru Dynasty",

  symbol: "✦",

  accent: "ambalika",

  relationships: [
    ["Ambika", "Elder sister and fellow Kuru queen"],
    ["Vichitravirya", "Husband"],
    ["Bhishma", "Brother-in-law and protector of the Kuru dynasty"],
    ["Vyasa", "Father of Pandu through niyoga"],
    ["Pandu", "Son"],
    ["Pandavas", "Mother of their father"],
    ["Kuru Dynasty", "Royal family"],
  ],

},

// =========================================================
// 33 — CHITRANGADA
// =========================================================

chitrangada: {

  name: "CHITRANGADA",

  title: "THE WARRIOR KING",

  subtitle:
    "The elder son of Shantanu and Satyavati who became an early king of the Kuru dynasty.",

  intro:
    "Chitrangada was the elder son of King Shantanu and Satyavati and succeeded his father as king of the Kurus. He was renowned as a powerful and formidable warrior, but his reign was brief. He was ultimately challenged and killed in battle by a Gandharva who shared his name, after which his younger brother Vichitravirya succeeded him as king.",

  nature:
    "Proud, courageous, disciplined, ambitious, fearless and fiercely martial.",

  strengths:
    "Warrior skill, physical strength, courage, royal authority, determination and battlefield confidence.",

  role: "Kuru King • Warrior Prince • Elder Son of Shantanu",

  affiliation: "Kuru Dynasty",

  symbol: "⚔",

  accent: "chitrangada",

  relationships: [
    ["Shantanu", "Father"],
    ["Satyavati", "Mother"],
    ["Vichitravirya", "Younger brother and successor"],
    ["Bhishma", "Elder half-brother and guardian of the Kuru dynasty"],
    ["Kuru Dynasty", "Royal lineage"],
    ["Gandharva Chitrangada", "Opponent who defeated him in battle"],
  ],

},

// =========================================================
// 34 — VICHITRAVIRYA
// =========================================================

vichitravirya: {

  name: "VICHITRAVIRYA",

  title: "THE YOUNG KING",

  subtitle:
    "The younger son of Shantanu and Satyavati who became king of the Kurus and husband of the princesses of Kashi.",

  intro:
    "Vichitravirya was the younger son of King Shantanu and Satyavati. After the death of his elder brother Chitrangada, he was placed upon the Kuru throne while still young. Bhishma brought the princesses Ambika and Ambalika from Kashi, and Vichitravirya married both of them. His reign was brief, and he died without producing a surviving son, leading to the succession crisis that eventually shaped the next generation of the Kuru dynasty.",

  nature:
    "Youthful, refined, thoughtful, dignified, sheltered and conscious of royal responsibility.",

  strengths:
    "Royal dignity, youthful determination, refinement, familial loyalty and commitment to his dynasty.",

  role: "Kuru King • Husband of Ambika and Ambalika • Son of Shantanu",

  affiliation: "Kuru Dynasty",

  symbol: "♛",

  accent: "vichitravirya",

  relationships: [
    ["Shantanu", "Father"],
    ["Satyavati", "Mother"],
    ["Chitrangada", "Elder brother"],
    ["Bhishma", "Elder half-brother and protector"],
    ["Ambika", "Wife"],
    ["Ambalika", "Wife"],
    ["Kuru Dynasty", "Royal lineage"],
  ],

},
  // =========================================================
  // 31 — DRUPADA
  // =========================================================

  drupada: {
    name: "DRUPADA",
    title: "THE KING",
    subtitle:
      "The king of Panchala whose rivalry with Drona shaped a generation.",
    intro:
      "Drupada was the powerful king of Panchala and an important ally of the Pandavas. His broken friendship with Drona became one of the defining rivalries that influenced the lives of Draupadi and Dhrishtadyumna.",
    nature:
      "Proud, authoritative, ambitious, strategic and deeply conscious of royal honor.",
    strengths:
      "Kingship, military command, political influence and strategic alliances.",
    role: "King • Warrior • Father",
    affiliation: "Panchala",
    symbol: "♛",
    accent: "drupada",
    relationships: [
      ["Draupadi", "Daughter"],
      ["Dhrishtadyumna", "Son"],
      ["Shikhandi", "Child"],
      ["Drona", "Former friend and rival"],
    ],
  },

  // =========================================================
  // 32 — DHRISHTADYUMNA
  // =========================================================

  dhrishtadyumna: {
    name: "DHRISHTADYUMNA",
    title: "THE COMMANDER",
    subtitle:
      "The warrior born for a destiny written before his battle began.",
    intro:
      "Dhrishtadyumna emerges as a major warrior and commander of the Pandava forces during the great war.",
    nature:
      "Determined, courageous, strategic and driven by purpose.",
    strengths:
      "Leadership, battlefield strategy and martial skill.",
    role: "Commander • Warrior • Prince",
    affiliation: "Panchala",
    symbol: "⚔",
    accent: "dhrishtadyumna",
    relationships: [
      ["Draupadi", "Sister"],
      ["Drupada", "Father"],
      ["Pandavas", "Allies"],
      ["Drona", "Fated adversary"],
    ],
  },

  // =========================================================
  // 33 — SHIKHANDI
  // =========================================================

  shikhandi: {
    name: "SHIKHANDI",
    title: "THE WARRIOR",
    subtitle:
      "A warrior whose identity and destiny were tied to an ancient grievance.",
    intro:
      "Shikhandi's story is deeply connected with Amba and the unresolved conflict surrounding Bhishma. As a warrior of Panchala, Shikhandi's presence on the battlefield became crucial to the eventual fall of the great Kuru elder.",
    nature:
      "Determined, courageous, intense and driven by a powerful sense of destiny.",
    strengths:
      "Resolve, courage, battlefield determination and an unwavering pursuit of purpose.",
    role: "Warrior • Prince of Panchala • Figure of Destiny",
    affiliation: "Panchala",
    symbol: "⚔",
    accent: "shikhandi",
    relationships: [
      ["Amba", "Previous life"],
      ["Drupada", "Parent"],
      ["Draupadi", "Sibling"],
      ["Bhishma", "Fated adversary"],
    ],
  },

  // =========================================================
  // 34 — UTTARA
  // =========================================================

  uttara: {
    name: "UTTARA",
    title: "THE PRINCESS",
    subtitle:
      "A princess whose life became part of the surviving lineage of the Pandavas.",
    intro:
      "Uttara was the princess of Matsya and daughter of King Virata. Her marriage to Abhimanyu connected the Pandavas with the kingdom of Matsya, and through her son Parikshit, the Pandava lineage continued after the great war.",
    nature:
      "Graceful, devoted, resilient and connected deeply to her family and lineage.",
    strengths:
      "Resilience, devotion, dignity and the strength to carry forward a royal lineage.",
    role: "Princess • Queen • Mother",
    affiliation: "Matsya / Kuru Dynasty",
    symbol: "✧",
    accent: "uttara",
    relationships: [
      ["Virata", "Father"],
      ["Abhimanyu", "Husband"],
      ["Parikshit", "Son"],
      ["Pandavas", "Family by marriage"],
    ],
  },

  // =========================================================
  // 35 — PARIKSHIT
  // =========================================================

  parikshit: {
    name: "PARIKSHIT",
    title: "THE KING",
    subtitle:
      "The heir who carried the surviving legacy of the Pandavas.",
    intro:
      "Parikshit was the son of Abhimanyu and Uttara and a descendant of the Pandavas. Born after the devastation of the Kurukshetra war, his survival represented the continuation of the Kuru lineage into the next generation.",
    nature:
      "Royal, thoughtful, courageous and conscious of the legacy inherited from his ancestors.",
    strengths:
      "Kingship, resilience, leadership and preservation of dynastic legacy.",
    role: "King • Heir • Kuru Descendant",
    affiliation: "Kuru Dynasty / Hastinapura",
    symbol: "♛",
    accent: "parikshit",
    relationships: [
      ["Abhimanyu", "Father"],
      ["Uttara", "Mother"],
      ["Arjuna", "Grandfather"],
      ["Pandavas", "Ancestors"],
    ],
  },

  // =========================================================
  // 36 — GANGA
  // =========================================================

  ganga: {
    name: "GANGA",
    title: "THE DIVINE MOTHER",
    subtitle:
      "The river goddess whose union with Shantanu gave birth to Bhishma.",
    intro:
      "Ganga is a divine figure whose story is woven into the origin of Bhishma and the Kuru succession. Her union with King Shantanu and the extraordinary circumstances surrounding their children became one of the earliest defining stories of the dynasty.",
    nature:
      "Mysterious, serene, powerful, compassionate and governed by a destiny beyond ordinary human understanding.",
    strengths:
      "Divine power, wisdom, spiritual presence and an unwavering commitment to destiny.",
    role: "Goddess • Mother • Queen",
    affiliation: "Divine Realm / Kuru Dynasty",
    symbol: "≋",
    accent: "ganga",
    relationships: [
      ["Shantanu", "Husband"],
      ["Bhishma", "Son"],
      ["Kuru Dynasty", "Dynastic connection"],
      ["Vasus", "Divine connection"],
    ],
  },
};

// =========================================================
// REVEAL ANIMATION
// =========================================================

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// =========================================================
// CHARACTER DETAIL
// =========================================================

function CharacterDetail() {
  const { characterId } = useParams();

  const character =
    characters[characterId?.toLowerCase()] || characters.krishna;

  return (
    <main
      className={`character-detail character-detail--${character.accent}`}
    >
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="detail-bg">
        <div className="detail-bg__glow" />

        <div className="detail-bg__geometry detail-bg__geometry--one" />

        <div className="detail-bg__geometry detail-bg__geometry--two" />

        <div className="detail-bg__geometry detail-bg__geometry--three" />

        <div className="detail-bg__rays" />

        <motion.div
          className="detail-bg__symbol"
          animate={{
            rotate: [0, 8, 0, -8, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {character.symbol}
        </motion.div>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}

      <header className="detail-nav">
        <Link
          to="/journey/mahabharata/characters"
          className="detail-nav__back"
        >
          <ArrowLeft size={16} />
          BACK TO CHARACTERS
        </Link>

        <div className="detail-nav__brand">
          ANCESTRA
        </div>

        <div className="detail-nav__label">
          THE PEOPLE
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="detail-hero">
        <motion.div
          className="detail-hero__content"
          initial={{
            opacity: 0,
            x: -50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <span className="detail-hero__eyebrow">
            {character.title}
          </span>

          {/* CHARACTER NAME */}

          <motion.h1
            className={`detail-hero__title ${
              character.name === "DHRISHTADYUMNA"
                ? "detail-hero__title--dhrishtadyumna"
                : character.name.length > 12
                ? "detail-hero__title--long"
                : character.name.length > 9
                ? "detail-hero__title--medium"
                : ""
            }`}
            initial={{
              opacity: 0,
              y: 70,
              filter: "blur(15px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1.4,
              delay: 0.2,
            }}
          >
            {character.name}
          </motion.h1>

          <div className="detail-hero__line" />

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 1,
              duration: 1,
            }}
          >
            {character.subtitle}
          </motion.p>
        </motion.div>

        {/* =========================================================
            SIDE INFO
        ========================================================= */}

        <motion.div
          className="detail-hero__info"
          initial={{
            opacity: 0,
            x: 50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: 0.7,
            duration: 1,
          }}
        >
          <div className="hero-stat">
            <span>ROLE</span>
            <strong>{character.role}</strong>
          </div>

          <div className="hero-stat">
            <span>AFFILIATION</span>
            <strong>{character.affiliation}</strong>
          </div>

          <div className="hero-stat">
            <span>ARCHIVE</span>
            <strong>MAHABHARATA</strong>
          </div>
        </motion.div>

        {/* SCROLL INDICATOR */}

        <motion.div
          className="detail-hero__scroll"
          animate={{
            y: [0, 8, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <ArrowDown size={16} />
          SCROLL TO EXPLORE
        </motion.div>
      </section>

      {/* =========================================================
          DIVIDER
      ========================================================= */}

      <div className="detail-divider">
        <span />
        <Sparkles size={15} />
        <span />
      </div>

      {/* =========================================================
          OVERVIEW
      ========================================================= */}

      <section className="detail-section detail-overview">
        <Reveal className="section-index">
          <span>01</span>
          <small>OVERVIEW</small>
        </Reveal>

        <Reveal
          delay={0.1}
          className="overview-content"
        >
          <h2>
            BEYOND THE <em>LEGEND</em>
          </h2>

          <p>{character.intro}</p>
        </Reveal>
      </section>

      {/* =========================================================
          CHARACTER ATTRIBUTES
      ========================================================= */}

      <section className="detail-section attributes">
        <Reveal className="section-index">
          <span>02</span>
          <small>THE CHARACTER</small>
        </Reveal>

        <div className="attribute-grid">
          {/* NATURE */}

          <Reveal className="attribute-card">
            <div className="attribute-card__top">
              <Crown size={20} />
              <span>01</span>
            </div>

            <h3>NATURE</h3>

            <p>{character.nature}</p>
          </Reveal>

          {/* STRENGTHS */}

          <Reveal
            delay={0.12}
            className="attribute-card"
          >
            <div className="attribute-card__top">
              <Shield size={20} />
              <span>02</span>
            </div>

            <h3>STRENGTHS</h3>

            <p>{character.strengths}</p>
          </Reveal>

          {/* ROLE */}

          <Reveal
            delay={0.24}
            className="attribute-card"
          >
            <div className="attribute-card__top">
              <Swords size={20} />
              <span>03</span>
            </div>

            <h3>ROLE</h3>

            <p>{character.role}</p>
          </Reveal>

          {/* LEGACY */}

          <Reveal
            delay={0.36}
            className="attribute-card"
          >
            <div className="attribute-card__top">
              <ScrollText size={20} />
              <span>04</span>
            </div>

            <h3>LEGACY</h3>

            <p>
              A life whose decisions became part of
              the larger story of the Kuru dynasty.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          RELATIONSHIPS
      ========================================================= */}

      <section className="detail-section relationships">
        <Reveal className="section-index">
          <span>03</span>
          <small>THE CONNECTIONS</small>
        </Reveal>

        <Reveal className="relationships-heading">
          <h2>
            THOSE WHO
            <br />
            <em>SHAPED THE STORY</em>
          </h2>
        </Reveal>

        <div className="relationship-grid">
          {character.relationships.map(
            ([name, relation], index) => (
              <Reveal
                key={name}
                delay={index * 0.08}
                className="relationship-card"
              >
                <span>0{index + 1}</span>

                <Users size={17} />

                <h3>{name}</h3>

                <p>{relation}</p>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* =========================================================
          PHILOSOPHY
      ========================================================= */}

      <section className="detail-philosophy">
        <div className="detail-philosophy__geometry" />

        <Reveal>
          <span className="detail-philosophy__eyebrow">
            THE PAST CANNOT BE CHANGED
          </span>

          <h2>
            BUT EVERY
            <br />
            <em>CHOICE</em> CAN BE
            <br />
            UNDERSTOOD.
          </h2>

          <p>
            Explore the character not as a simple hero or
            villain, but as a person shaped by duty,
            relationships, choices and consequences.
          </p>
        </Reveal>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="detail-footer">
        <span>ANCESTRA</span>

        <span>{character.name}</span>

        <span>MAHABHARATA</span>
      </footer>
    </main>
  );
}

export default CharacterDetail;