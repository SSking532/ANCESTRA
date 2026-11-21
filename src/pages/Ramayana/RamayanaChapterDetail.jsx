import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  Link,
  useParams,
} from "react-router-dom";
import { useState } from "react";

import "./RamayanaChapterDetail.css";

import InteractionModal from "./interactions/InteractionModal";

/* =========================================================
   CHAPTER GAMES  (sorted chapterwise)
========================================================= */

// Chapter I
import PutrakameshtiGame from "./interactions/PutrakameshtiGame";

// Chapter II
import PrinceTrainingGame from "./interactions/PrinceTrainingGame";
import FathersDilemmaGame from "./interactions/FathersDilemmaGame";

// Chapter III
import ForestListeningGame from "./interactions/ForestListeningGame";
import TatakaGame from "./interactions/TatakaGame";

// Chapter IV
import GardensOfMithilaGame from "./interactions/GardensOfMithilaGame";
import MemoryOfASageGame from "./interactions/MemoryOfASageGame";
import SacredBowGame from "./interactions/SacredBowGame";
import SecondBowGame from "./interactions/SecondBowGame";
import WeddingGame from "./interactions/WeddingGame";

// Chapter V
import PrepareCoronationGame from "./interactions/PrepareCoronationGame";
import MantharaCounselGame from "./interactions/MantharaCounselGame";
import LakshmanaUrmila from "./interactions/LakshmanaUrmila/LakshmanaUrmila";

// Chapter VI
import TheOtherShoreGame from "./interactions/TheOtherShoreGame/TheOtherShoreGame";
import AHomeInChitrakuta from "./interactions/AHomeInChitrakuta/AHomeInChitrakuta";
import AKingdomHeldInTrust from "./interactions/AKingdomHeldInTrust/AKingdomHeldInTrust";

// Chapter VII
import ViradhaRescueGame from "./interactions/ViradhaRescueGame";
import AgastyaGiftsGame from "./interactions/AgastyaGiftsGame";
import JatayuGame from "./interactions/JatayuGame";

// Chapter VIII
import FourteenThousandGame from "./interactions/FourteenThousandGame";
import GoldenIllusionGame from "./interactions/GoldenIllusionGame";
import JatayuLastFlightGame from "./interactions/JatayuLastFlightGame";

// Chapter IX
import JatayuLastTestimony from "./interactions/JatayuLastTestimony";

// Chapter X
import PromiseOfFire from "./interactions/PromiseOfFire";
import SevenSalTrees from "./interactions/SevenSalTrees";
import ValiSugrivaCinematic from "./interactions/ValiSugriva/ValiSugrivaCinematic";

// Chapter XI
import TwoBrothersOneSky from "./interactions/TwoBrothersOneSky";
import KingsLivingMap from "./interactions/KingsLivingMap";
import HiddenPassageMaze from "./interactions/HiddenPassageMaze";

// Chapter XII
import HanumanAwakeningGame from "./interactions/HanumanAwakeningGame";
import SitaHanumanMeetingGame from "./interactions/SitaHanumanMeetingGame";
import LankaDahanGame from "./interactions/LankaDahanGame";

// Chapter XIII
import RamSetuGame from "./interactions/RamSetuGame/RamSetuGame";

// Chapter XIV
import VibhishanaRefugeGame from "./interactions/VibhishanaRefugeGame";
import AngadaChallengeGame from "./interactions/AngadaChallengeGame";

// Chapter XV
import AssaultOnLankaGame from "./interactions/AssaultOnLanka/AssaultOnLankaGame";
import GarudaArrivalGame from "./interactions/GarudaArrivalGame";

// Chapter XVI
import KumbhakarnaAwakening from "./interactions/KumbhakarnaAwakening/KumbhakarnaAwakening";
import HanumanKumbhakarnaGame from "./interactions/HanumanKumbhakarna/HanumanKumbhakarnaGame";
import KumbhakarnaFinalBattle from "./interactions/KumbhakarnaFinalBattle/KumbhakarnaFinalBattle";

// Chapter XVII
import IndrajitPromiseGame from "./interactions/IndrajitPromiseGame";
import MountainOfLifeGame from "./interactions/MountainOfLifeGame/MountainOfLifeGame";

// Chapter XVIII
// Chapter XVIII
import NikumbhilaRitual from "./interactions/NikumbhilaRitual";
import LakshmanaVsIndrajit from "./interactions/lakshmana-vs-indrajit/LakshmanaVsIndrajitGame";
import FathersLossGame from "./interactions/FathersLossGame";

// Chapter XIX
import JambavanRavanaGame from "./interactions/JambavanRavana/JambavanRavanaGame";
import ArtOfWarGame from "./interactions/ArtOfWar/ArtOfWarGame";
import TheLastWords from "./interactions/TheLastWords";

// Chapter XX
import TheMessageOfHope from "./interactions/TheMessageOfHope";
import RamaRavanaDuel from "./interactions/RamaRavanaDuel/RamaRavanaDuel";
import RamaRavanaDuelPart2 from "./interactions/RamaRavanaDuel/RamaRavanaDuelPart2";

// Chapter XXI
import FamilyReunited from "./interactions/FamilyReunited";

// Chapter XXII
import DutyOfTheCrownGame from "./interactions/DutyOfTheCrownGame";

// Chapter XXIII
import SitaLakshmana from "./interactions/SitaLakshmana";

// Chapter XXIV
import TwinTrialsGame from "./interactions/TwinTrials/TwinTrialsGame";
import QuestionOfTheirFatherGame from "./interactions/QuestionOfTheirFatherGame";

// Chapter XXVI
import LuvKushGame from "./interactions/LuvKushGame";
import SitasFinalJourney from "./interactions/SitasFinalJourney/SitasFinalJourney";

// Chapter XXVII
import ImpossibleChoiceGame from "./interactions/ImpossibleChoiceGame";

// Chapter XXVIII
import TheFarewell from "./interactions/TheFarewell";



/* =========================================================
   CHAPTER QUIZZES  (sorted chapterwise)
========================================================= */

import Chapter01Quiz from "./interactions/Chapter01Quiz";
import Chapter02Quiz from "./interactions/Chapter02Quiz";
import Chapter03Quiz from "./interactions/Chapter03Quiz";
import Chapter04Quiz from "./interactions/Chapter04Quiz";
import Chapter05Quiz from "./interactions/Chapter05Quiz";
import Chapter06Quiz from "./interactions/Chapter06Quiz";
import Chapter07Quiz from "./interactions/Chapter07Quiz";
import Chapter08Quiz from "./interactions/Chapter08Quiz";
import Chapter09Quiz from "./interactions/Chapter09Quiz";
import Chapter11Quiz from "./interactions/Chapter11Quiz";
import Chapter12Quiz from "./interactions/Chapter12Quiz";
import Chapter13Quiz from "./interactions/Chapter13Quiz";
import Chapter14Quiz from "./interactions/Chapter14Quiz";
import Chapter15Quiz from "./interactions/Chapter15Quiz";
import Chapter17Quiz from "./interactions/Chapter17Quiz";
import Chapter23Quiz from "./interactions/Chapter23Quiz";
import Chapter25Quiz from "./interactions/Chapter25Quiz";
import Chapter27Quiz from "./interactions/Chapter27Quiz";
import Chapter28Quiz from "./interactions/Chapter28Quiz";

/* =========================================================
   CHAPTER DATA
========================================================= */

import chapter01 from "./data/chapter01";
import chapter02 from "./data/chapter02";
import chapter03 from "./data/chapter03";
import chapter04 from "./data/chapter04";
import chapter05 from "./data/chapter05";
import chapter06 from "./data/chapter06";
import chapter07 from "./data/chapter07";
import chapter08 from "./data/chapter08";
import { chapter09 } from "./data/chapter09";
import { chapter10 } from "./data/chapter10";
import { chapter11 } from "./data/chapter11";
import { chapter12 } from "./data/chapter12";
import { chapter13 } from "./data/chapter13";
import { chapter14 } from "./data/chapter14";
import { chapter15 } from "./data/chapter15";
import { chapter16 } from "./data/chapter16";
import { chapter17 } from "./data/chapter17";
import { chapter18 } from "./data/chapter18";
import { chapter19 } from "./data/chapter19";
import chapter20 from "./data/chapter20";
import chapter21 from "./data/chapter21";
import chapter22 from "./data/chapter22";
import chapter23 from "./data/chapter23";
import chapter24 from "./data/chapter24";
import chapter25 from "./data/chapter25";
import chapter26 from "./data/chapter26";
import chapter27 from "./data/chapter27";
import chapter28 from "./data/chapter28";

/* Where the "all chapters" index page lives. Every back / return link on this
   page uses this one constant — change it here if the index route ever moves. */
const CHAPTERS_INDEX_PATH = "/journey/ramayana/chapters/";

const chapters = {
  1: chapter01,
  2: chapter02,
  3: chapter03,
  4: chapter04,
  5: chapter05,
  6: chapter06,
  7: chapter07,
  8: chapter08,
  9: chapter09,
  10: chapter10,
  11: chapter11,
  12: chapter12,
  13: chapter13,
  14: chapter14,
  15: chapter15,
  16: chapter16,
  17: chapter17,
  18: chapter18,
  19: chapter19,
  20: chapter20,
  21: chapter21,
  22: chapter22,
  23: chapter23,
  24: chapter24,
  25: chapter25,
  26: chapter26,
  27: chapter27,
  28: chapter28,
};

/* =========================================================
   LUV & KUSH — picks 91 random scene images, in chronological order
   (2s each = the full 3:02 of /audio/luvkush.mp3). The list is
   chosen once per opening, so it never reshuffles mid-show.
========================================================= */

const LUVKUSH_IMAGE_COUNT = 91;

const IMG_EXT = /\.(jpe?g|png|webp|avif|gif|svg)(\?.*)?$/i;

/* scene images may be plain URLs, imported modules, or live under another key */
const sceneImageUrls = (scene) => {
  if (!scene || typeof scene !== "object") return [];
  const toUrl = (v) =>
    typeof v === "string" ? v : v && typeof v === "object" ? v.default || v.src || "" : "";
  const main = toUrl(scene.image);
  if (main) return [main];
  return Object.values(scene)
    .map(toUrl)
    .filter((v) => typeof v === "string" && IMG_EXT.test(v));
};

/* The show must finish on this image; nothing after it is used. */
const LUVKUSH_LAST_IMAGE = /scene2416\.\w+/i;

const pickLuvKushImages = () => {
  /* chapters in numeric order, scenes in story order → chronological pool */
  const ordered = Object.keys(chapters)
    .map(Number)
    .sort((x, y) => x - y)
    .flatMap((k) => (Array.isArray(chapters[k]?.scenes) ? chapters[k].scenes : []))
    .flatMap(sceneImageUrls)
    .filter(Boolean);
  const unique = [...new Set(ordered)]; /* keeps first-seen (chronological) order */

  /* cut everything after scene2416 */
  const endIdx = unique.findIndex((src) => LUVKUSH_LAST_IMAGE.test(src));
  if (endIdx < 0) console.warn("[LuvKush] scene2416 not found in chapter data — using the full list");
  const upToEnd = endIdx >= 0 ? unique.slice(0, endIdx + 1) : unique;

  const fromChapters = upToEnd.filter(
    (src) => src.includes("/images/chapters/") || LUVKUSH_LAST_IMAGE.test(src)
  );
  const pool = fromChapters.length >= LUVKUSH_IMAGE_COUNT ? fromChapters : upToEnd;
  if (!pool.length) return [];

  /* Stratified random pick: split the story into 91 equal stretches and take
     one random image from each → random skips, but always in story order.
     The final slot is pinned to the last image (scene2416). */
  const picked = [];
  for (let i = 0; i < LUVKUSH_IMAGE_COUNT; i++) {
    const start = Math.floor((i * pool.length) / LUVKUSH_IMAGE_COUNT);
    const end = Math.max(start + 1, Math.floor(((i + 1) * pool.length) / LUVKUSH_IMAGE_COUNT));
    picked.push(pool[start + Math.floor(Math.random() * (end - start))]);
  }
  picked[picked.length - 1] = pool[pool.length - 1];
  console.info(
    `[LuvKush] ${unique.length} scene images found, ${pool.length} up to the last image, using ${picked.length}. Ends on:`,
    picked[picked.length - 1]
  );
  return picked;
};

function LuvKushFromChapters({ onComplete, onExit }) {
  const [images] = useState(pickLuvKushImages);
  return <LuvKushGame images={images} onComplete={onComplete} onExit={onExit} />;
}

/* =========================================================
   ROMAN NUMERAL
========================================================= */

const toRoman = (number) => {
  const romanMap = [
    { value: 1000, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" },
  ];

  let result = "";
  let remaining = number;

  for (const item of romanMap) {
    while (remaining >= item.value) {
      result += item.symbol;
      remaining -= item.value;
    }
  }

  return result;
};

const ORDINALS = [
  "ZEROTH", "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH",
  "SEVENTH", "EIGHTH", "NINTH", "TENTH", "ELEVENTH", "TWELFTH",
  "THIRTEENTH", "FOURTEENTH", "FIFTEENTH", "SIXTEENTH", "SEVENTEENTH",
  "EIGHTEENTH", "NINETEENTH", "TWENTIETH", "TWENTY-FIRST",
  "TWENTY-SECOND", "TWENTY-THIRD", "TWENTY-FOURTH", "TWENTY-FIFTH",
  "TWENTY-SIXTH", "TWENTY-SEVENTH", "TWENTY-EIGHTH",
];

/* =========================================================
   GAME CARDS  (one list per chapter, in scene order)

   `at` says which scene the card appears after:
     { index: n }   → after the scene at array position n
     { number: n }  → after the scene whose `number` equals n
   The numeral (I, II, III …) is assigned automatically
   from the order of the list.
========================================================= */

const GAME_CARDS = {
  1: [
    {
      at: { index: 8 },
      interaction: "rite",
      eyebrow: "INTERACTIVE CHRONICLE",
      title: "Reconstruct the Sacred Rite",
      text: "You have witnessed the preparations, the royal sacrifice, and the Putrakameshti. Now retrace the events in the order they unfolded.",
      button: "PLAY THE RITE",
    },
  ],

  2: [
    {
      at: { index: 4 },
      interaction: "training",
      eyebrow: "INTERACTIVE CHRONICLE",
      title: "The Prince's Training",
      text: "Knowledge, dharma, discipline, concentration and restraint. Enter the training grounds and experience the lessons that shaped the four princes of Ayodhya.",
      button: "ENTER THE TRAINING",
    },
    {
      at: { index: 16 },
      interaction: "fathers-dilemma",
      eyebrow: "INTERACTIVE CHRONICLE",
      title: "The Father's Dilemma",
      text: "A king must uphold his duty. A father wants only to protect his son. Enter Dasharatha's chamber and experience the weight of the choice before him.",
      button: "ENTER THE DILEMMA",
    },
  ],

  3: [
    {
      at: { index: 2 },
      interaction: "forest-listening",
      eyebrow: "THE FIRST TEACHING",
      title: "The Forest Listens",
      text: "Vishvamitra begins teaching Rama that the wilderness cannot be understood through strength alone. Enter the ancient forest, quiet your senses, and learn to notice what others overlook.",
      button: "ENTER THE FOREST",
    },
    {
      at: { index: 10 },
      interaction: "tataka",
      eyebrow: "THE SECOND GREAT TRIAL",
      title: "Tataka — The First Great Trial",
      text: "The forest has fallen silent. Tataka has appeared, and Rama now faces his first great trial beyond the safety of Ayodhya. Survive the assault, find the opening, and act with discipline.",
      button: "ENTER THE TRIAL",
    },
  ],

  4: [
    {
      at: { index: 10 },
      interaction: "gardens-of-mithila",
      eyebrow: "THE FIRST GARDEN",
      title: "The Gardens of Mithila",
      text: "Some moments do not announce themselves. Enter the gardens, observe carefully, and remember what the morning quietly revealed.",
      button: "ENTER THE GARDEN",
    },
    {
      at: { index: 15 },
      interaction: "memory-of-a-sage",
      eyebrow: "THE MEMORY OF A SAGE",
      title: "The Memory of a Sage",
      text: "Before Vishvamitra became a sage, he was a king. Enter his memory and reconstruct the journey from royal power to spiritual discipline.",
      button: "ENTER THE MEMORY",
    },
    {
      at: { index: 20 },
      interaction: "sacred-bow",
      eyebrow: "THE THIRD GREAT TRIAL",
      title: "The Sacred Bow",
      text: "Enter Janaka's hall and experience the moment when Rama takes the sacred bow. Click through each movement, draw it farther, and face the moment when its limit is reached.",
      button: "ENTER THE HALL",
    },
    {
      at: { number: 28 },
      interaction: "wedding",
      eyebrow: "THE DIVINE UNION",
      title: "The Wedding of Rama and Sita",
      text: "The bow is broken and the vow is spoken. Witness the sacred wedding of Rama and Sita beneath a shower of petals, a silent celebration of two lives becoming one.",
      button: "WITNESS THE WEDDING",
    },
    {
      at: { number: 33 },
      interaction: "second-bow",
      eyebrow: "THE FINAL ENCOUNTER",
      title: "The Second Bow",
      text: "The road falls silent before a warrior sage of immense power. Witness the confrontation, hear the words exchanged, and discover the recognition that ends the encounter.",
      button: "ENTER THE ENCOUNTER",
    },
  ],

  5: [
    {
      at: { number: 7 },
      interaction: "prepare-coronation",
      eyebrow: "THE FIRST CELEBRATION",
      title: "Prepare the Coronation",
      text: "Ayodhya is preparing for Rama's coronation. Decorate the city, create the rangoli, prepare the sacred ceremony and light the lamps before the celebration begins.",
      button: "PREPARE AYODHYA",
    },
    {
      at: { number: 12 },
      interaction: "manthara-counsel",
      eyebrow: "THE SECOND GREAT TRIAL",
      title: "Manthara's Counsel",
      text: "Ayodhya rejoices at Rama's coming coronation. But Manthara sees the celebration differently. Enter Kaikeyi's chamber, listen to Manthara's carefully chosen words, and discover how fear and suspicion can turn a moment of joy into a crisis for the royal family.",
      button: "ENTER THE QUEEN'S CHAMBER",
    },
    {
      at: { number: 29 },
      interaction: "lakshmana-urmila",
      eyebrow: "TWO RESPONSIBILITIES · ONE BOND",
      title: "The Promise Left Unspoken",
      text: "Before Lakshmana leaves with Rama, he must speak to the person whose life is bound to his own. Enter a private conversation between two people who understand duty, love, and the cost of both.",
      button: "ENTER THE CONVERSATION",
    },
  ],

  6: [
    {
      at: { number: 8 },
      interaction: "the-other-shore",
      eyebrow: "THE FIRST CROSSING",
      title: "The Other Shore",
      text: "The Ganga lies between the life they have left behind and the forest journey ahead. Guide the boat through the river and help Rama, Sita and Lakshmana reach the opposite bank.",
      button: "BEGIN THE CROSSING",
    },
    {
      at: { number: 15 },
      interaction: "chitrakuta-home",
      eyebrow: "THE SECOND CREATION",
      title: "A Home in Chitrakuta",
      text: "The forest will become their home. Choose a peaceful site, prepare the ground, raise the walls and create a dwelling where Rama, Sita and Lakshmana can live during their years of exile.",
      button: "BUILD THE HERMITAGE",
    },
    {
      at: { number: 45 },
      interaction: "kingdom-held-in-trust",
      eyebrow: "THE THIRD CREATION",
      title: "A Kingdom Held in Trust",
      text: "Bharata has returned with Rama's sandals and a promise. Prepare the royal assembly, place the padukas upon the throne, and witness the vow of a brother who will govern without claiming the kingdom as his own.",
      button: "PREPARE THE ROYAL ASSEMBLY",
    },
  ],

  7: [
    {
      at: { index: 10 },
      interaction: "viradha-rescue",
      eyebrow: "THE FIRST GREAT BATTLE",
      title: "Viradha — The Rescue",
      text: "The forest has turned dangerous. Viradha has seized Sita, and Rama must face the powerful being standing between him and her rescue. Enter the battlefield, evade the attacks, and overcome the forest demon.",
      button: "ENTER THE BATTLE",
    },
    {
      at: { number: 20 },
      interaction: "agastya-gifts",
      eyebrow: "A SACRED ENCOUNTER",
      title: "The Gifts of Sage Agastya",
      text: "Within the sacred hermitage, a divine ritual awaits. Arrange the ancient mantras, complete the offerings, and witness the celestial gifts entrusted to Rama and the wisdom shared with Lakshmana.",
      button: "ENTER THE RITUAL",
    },
    {
      at: { number: 23 },
      interaction: "jatayu",
      eyebrow: "A NEW DWELLING",
      title: "Jatayu: The Oath of Friendship",
      text: "A meeting in the forest. An old friendship remembered. A promise made by the mighty king of the skies.",
      button: "BEGIN THE EXPERIENCE",
    },
  ],

  8: [
    {
      at: { number: 18 },
      interaction: "fourteen-thousand",
      eyebrow: "THE BATTLE OF JANASTHANA",
      title: "The Fourteen Thousand",
      text: "Khara's army advances upon Panchavati. Rama stands alone before the approaching host. Enter the battlefield and witness the great confrontation of Janasthana.",
      button: "ENTER THE BATTLEFIELD",
    },
    {
      at: { number: 31 },
      interaction: "golden-illusion",
      eyebrow: "THE ENCHANTING GOLDEN DEER",
      title: "The Golden Illusion",
      text: "A magnificent golden deer appears in the forest, captivating Sita with its extraordinary beauty. Follow its mysterious golden hoofprints through the wilderness and witness the illusion that draws Rama away.",
      button: "FOLLOW THE GOLDEN TRAIL",
    },
    {
      at: { number: 44 },
      interaction: "jatayu-last-flight",
      eyebrow: "THE LAST FLIGHT",
      title: "Jatayu: The Last Flight",
      text: "As Ravana carries Sita towards Lanka, Jatayu rises to confront the king of Lanka. Enter the skies and witness the final, courageous stand of the noble king of birds.",
      button: "ENTER THE BATTLEFIELD",
    },
  ],

  9: [
    {
      at: { number: 5 },
      interaction: "jatayu-testimony",
      eyebrow: "THE FINAL TESTIMONY",
      title: "Jatayu's Last Testimony",
      text: "Beneath the ancient trees lies a noble friend of Dasharatha. Jatayu carries one final truth for Rama — the fate of Sita and the sacrifice he made trying to protect her. Witness his final moments and the courage that shall never be forgotten.",
      button: "HEAR JATAYU'S FINAL WORDS",
    },
  ],

  10: [
    {
      at: { number: 9 },
      interaction: "promise-of-fire",
      eyebrow: "A SACRED FRIENDSHIP",
      title: "The Promise of Fire",
      text: "Before the sacred fire, Rama and Sugriva exchange solemn promises. Witness the moment their paths become bound by friendship, trust and duty.",
      button: "WITNESS THE PLEDGE",
    },
    {
      at: { number: 30 },
      interaction: "seven-sal-trees",
      eyebrow: "A TEST OF STRENGTH",
      title: "The Seven Sal Trees",
      text: "Sugriva has witnessed Vali's extraordinary strength. But can Rama truly stand against him? Enter the sacred forest and witness the trial of seven Sal trees.",
      button: "ENTER THE SACRED FOREST",
    },
    {
      at: { number: 38 },
      interaction: "vali-sugriva-cinematic",
      eyebrow: "THE FINAL CONFRONTATION",
      title: "Vali vs Sugriva",
      text: "Two brothers. One kingdom. Watch the golden king crush his brother in the dust, until a single arrow from the thicket decides the fate of Kishkindha.",
      button: "WATCH THE FINAL CONFRONTATION",
    },
  ],

  11: [
    {
      at: { number: 13 },
      interaction: "kings-living-map",
      eyebrow: "THE FOUR DIRECTIONS OF THE SEARCH",
      title: "The King's Living Map",
      text: "Four expeditions prepare to depart across the vast lands. Enter Sugriva's strategy chamber, explore the four directions and organise the search for Sita.",
      button: "OPEN THE MAP",
    },
    {
      at: { number: 28 },
      interaction: "hidden-passage-maze",
      eyebrow: "AN ANCIENT SECRET AWAITS",
      title: "The Hidden Passage",
      text: "Beyond the mysterious garden lies a maze of ancient passages. Find your way through its winding paths, discover the hidden opening, and reach the exit.",
      button: "ENTER THE MAZE",
    },
    {
      at: { number: 36 },
      interaction: "two-brothers-one-sky",
      eyebrow: "A LEGEND OF BROTHERHOOD",
      title: "Two Brothers, One Sky",
      text: "Before the world remembered their names, two brothers shared the same sky. Take flight with Jatayu and Sampati on an extraordinary journey towards the blazing sun, where a brother's love will be tested beyond measure.",
      button: "BEGIN THE FLIGHT",
    },
  ],

  12: [
    {
      at: { number: 8 },
      interaction: "hanuman-awakening",
      eyebrow: "THE AWAKENING OF DIVINE STRENGTH",
      title: "The Awakening of Hanuman",
      text: "The ocean stands before him. The journey to Lanka awaits. But before Hanuman can cross the endless waters, he must remember the immeasurable strength that lies within him. Restore the sacred mantra, awaken his forgotten power, and witness the moment the world discovers his true might.",
      button: "AWAKEN THE MIGHT",
    },
    {
      at: { number: 33 },
      interaction: "sita-hanuman-meeting",
      eyebrow: "A MEETING ACROSS THE OCEAN",
      title: "The Messenger of Rama",
      text: "Hidden among the branches of Ashoka Vatika, Hanuman has finally found Sita. He carries Rama's message across the ocean, but Sita has a message of her own that must find its way back to Ayodhya.",
      button: "ENTER ASHOKA VATIKA",
    },
    {
      at: { number: 38 },
      interaction: "lanka-dahan",
      eyebrow: "THE FINAL ACT OF THE MESSENGER",
      title: "Lanka Dahan",
      text: "The fire placed upon Hanuman's tail was meant to humiliate him. But the messenger of Rama has other plans. Take flight across the golden rooftops of Lanka and witness the night the city will never forget.",
      button: "BEGIN LANKA DAHAN",
    },
  ],

  13: [
    {
      at: { number: 13 },
      interaction: "ram-setu",
      eyebrow: "AN INTERACTIVE EXPERIENCE",
      title: "The Making of Ram Setu",
      text: "A vast ocean stands between two shores. Inscribe the name of Rama, place the first stone, and join the Vanara builders in constructing the bridge that will lead the army to Lanka.",
      button: "BEGIN CONSTRUCTION",
    },
  ],

  14: [
    {
      at: { number: 6 },
      interaction: "vibhishana-refuge",
      eyebrow: "AN INTERACTIVE CHRONICLE",
      title: "The Refuge of Vibhishana",
      text: "A stranger arrives seeking protection. His loyalty is questioned, his intentions debated, and Rama must decide whether to grant him refuge.",
      button: "ENTER THE COUNCIL",
    },
    {
      at: { number: 17 },
      interaction: "angada-challenge",
      eyebrow: "A TEST OF STRENGTH",
      title: "The Unmovable Foot",
      text: "Angada has challenged the warriors of Lanka. Can anyone move the foot he has planted before Ravana's throne? Step forward and face the challenge.",
      button: "ACCEPT THE CHALLENGE",
    },
  ],

  15: [
    {
      at: { number: 4 },
      interaction: "assault-on-lanka",
      eyebrow: "THE FIRST CLASH",
      title: "The Battle of Lanka",
      text: "The conches have sounded and the gates of Lanka are open. Fight as a vanara warrior beside your companions and hold the field against Rakshasas and giants.",
      button: "ENTER THE BATTLE",
    },
    {
      at: { number: 25 },
      interaction: "garuda-arrival",
      eyebrow: "THE ARRIVAL OF GARUDA",
      title: "The Serpent Bonds Are Broken",
      text: "The Nagapasha of Indrajit holds Rama and Lakshmana fast, and the Vanara army waits in silence. Feel the wind change, watch the heavens open, and release the bonds as the King of Birds descends upon the field.",
      button: "WITNESS THE ARRIVAL",
    },
  ],

  16: [
    {
      at: { number: 1 },
      interaction: "awaken-kumbhakarna",
      eyebrow: "THE SLEEPING GIANT",
      title: "Awaken Kumbhakarna",
      text: "Deep within Lanka, Ravana's mighty brother sleeps a sleep no sound can break. The war is at the gates and the king has ordered that he must awaken. Sound the drums, hurl the spears and carry the scent of the royal feast to the sleeping giant.",
      button: "ENTER THE CHAMBER",
    },
    {
      at: { number: 16 },
      interaction: "hanuman-kumbhakarna",
      eyebrow: "THE CLASH OF GIANTS",
      title: "Hanuman and Kumbhakarna",
      text: "The battlefield trembles beneath Kumbhakarna's footsteps as he scatters Rama's army. Then Hanuman grows to meet him. One fights with the strength of a mountain, the other with the courage of devotion. Witness the havoc of the fight between two giants.",
      button: "WITNESS THE CLASH",
    },
    {
      at: { number: 29 },
      interaction: "kumbhakarna-final-battle",
      eyebrow: "THE FINAL CONFRONTATION",
      title: "The Final Battle of Kumbhakarna",
      text: "Kumbhakarna still stands. His shadow falls across the Vanara army, and Lord Rama steps forward to meet him. Circle the giant, dodge the swing of his mace, and loose your arrows until the battle reaches its destined end.",
      button: "FACE THE GIANT",
    },
  ],

  17: [
    {
      at: { number: 2 },
      interaction: "indrajit-promise",
      eyebrow: "A SON'S PROMISE. A KING'S BLESSING.",
      title: "The Prince Who Stepped Forward",
      text: "Kumbhakarna has fallen, and Lanka stands beneath the shadow of grief. Enter the royal court and witness the conversation between Ravana and his son Indrajit, the promise made, and the blessing given before the prince departs for battle.",
      button: "ENTER THE ROYAL COURT",
    },
    {
      at: { number: 16 },
      interaction: "mountain-of-life",
      eyebrow: "THE HERB OF LIFE",
      title: "The Mountain of Life",
      text: "Lakshmana lies wounded and the night is running out. Hanuman streaks across the sky to the Himalayas, but the Sanjeevani hides among a thousand glowing herbs. Search the slopes, grow beyond the clouds and lift the entire mountain.",
      button: "FLY TO THE HIMALAYAS",
    },
  ],

  18: [
    {
      at: { number: 2 },
      interaction: "nikumbhila-ritual",
      eyebrow: "THE SACRED RITUAL",
      title: "The Ritual of Nikumbhila",
      text: "At the sacred grounds of Nikumbhila, Meghnath begins a secret ritual. Arrange five Vedic mantras in their proper sequence and offer each one into the sacred fire.",
      button: "BEGIN THE RITUAL",
    },
    {
    at: { number: 12 },
    interaction: "lakshmana-vs-indrajit",
    eyebrow: "THE DUEL OF DESTINY",
    title: "Lakshmana vs Indrajit",
    text: "The ritual was never completed, and Indrajit now rides out to fight. Enter the battlefield, face the master of illusion, and strike when the moment comes.",
    button: "ENTER THE DUEL",
  },
    {
      at: { number: 19 },
      interaction: "fathers-loss",
      eyebrow: "A FATHER'S GREATEST LOSS",
      title: "The Fall of Indrajit",
      text: "The king of Lanka waits for the return of his greatest warrior. Enter the royal court and witness the moment Ravana learns that his son has fallen, and the father behind the king is revealed.",
      button: "ENTER THE ROYAL COURT",
    },
  ],

  19: [
     {
      at: { number: 6 },
      interaction: "jambavan-ravana",
      eyebrow: "THE CHALLENGE OF THE ANCIENT ONE",
      title: "Jambavan vs Ravana",
      text: "Before the golden gates of Lanka, Ravana taunts the old bear king with the memory of Jatayu. Witness the clash of two legends, from the first insult to the moment the king of Lanka is thrown from his feet.",
      button: "WITNESS THE BATTLE",
    },
    {
      at: { number: 10 },
      interaction: "art-of-war",
      eyebrow: "THE ART OF WAR",
      title: "Five Formations. One Strategist.",
      text: "Beneath the golden walls of Lanka, five enemy formations stand arrayed. Study each one from above, choose the formation that answers it, and watch the two armies decide the field.",
      button: "TAKE COMMAND",
    },
    {
      at: { number: 22 },
      interaction: "last-words",
      eyebrow: "THE FINAL EXCHANGE",
      title: "The Last Words",
      text: "The armies have fallen silent. Before the final battle begins, Rama and Ravana speak one last time. Listen to the pride of Lanka, the words of Dharma, and the silence that follows.",
      button: "WITNESS THE LAST WORDS",
    },
  ],

  20: [
    {
      at: { number: 7 },
      interaction: "rama-ravana-duel",
      eyebrow: "THE FINAL BATTLE BEGINS · PART I",
      title: "Rama vs Ravana",
      text: "The armies have drawn back and the sky itself holds its breath. Rama stands on the ground; Ravana rides his chariot. Witness the first exchange of arrows, the demon king's terrible form, the divine chariot sent by Indra, and the astras that follow.",
      button: "WITNESS THE DUEL",
    },
    {
      at: { number: 10 },
      interaction: "rama-ravana-duel-2",
      eyebrow: "THE FINAL BATTLE · PART II",
      title: "The Final Arrow",
      text: "The duel rages on, and Rama remembers the secret Vibhishana whispered: the nectar of Ravana's life lies in his navel. Witness the weapon of Brahma gather the lightning of the heavens, and the arrow that ends the king of Lanka.",
      button: "WITNESS THE FINAL ARROW",
    },
    {
      at: { number: 20 },
      interaction: "message-of-hope",
      eyebrow: "THE MESSAGE OF HOPE",
      title: "Hanuman Returns to Sita",
      text: "The war is over and Lanka is silent. Hanuman returns to Sita in the Ashoka grove with the news she has waited for. Walk with them through the questions she dares to ask and the answers that bring her hope.",
      button: "RECEIVE THE MESSAGE",
    },
  ],

  21: [
    {
      at: { number: 20 },
      interaction: "family-reunited",
      eyebrow: "THE HOMECOMING",
      title: "The Family Reunited",
      text: "Fourteen years have passed. Step into the palace of Ayodhya as a silent witness, and watch the brothers, the mothers and the wives find one another again.",
      button: "ENTER THE PALACE",
    },
  ],

  22: [
    {
      at: { number: 2 },
      interaction: "prepare-coronation",
      eyebrow: "THE ROYAL PREPARATIONS",
      title: "Prepare the Coronation",
      text: "Rama has returned, and Ayodhya is ready to celebrate. Decorate the palace, create the rangoli and open the royal gates to welcome the coronation.",
      button: "PREPARE AYODHYA",
    },
    {
      at: { number: 9 },
      interaction: "duty-of-the-crown",
      eyebrow: "THE DUTY OF THE CROWN",
      title: "Rule Ayodhya as Rama",
      text: "The crown is yours to wear, and Ayodhya has come to be heard. Sit in the royal court, listen to your people, and decide each matter as a king bound by dharma.",
      button: "ENTER THE ROYAL COURT",
    },
  ],

  23: [
    {
      at: { number: 10 },
      interaction: "sita-lakshmana",
      eyebrow: "THE SHADOW OVER AYODHYA",
      title: "Sita and Lakshmana",
      text: "The Ganga lies behind them, and Lakshmana has not spoken since. Stand beside the sacred river and witness the farewell that no one in Ayodhya will ever see.",
      button: "WITNESS THE FAREWELL",
    },
  ],

  24: [
    {
      at: { number: 6 },
      interaction: "twin-trials",
      eyebrow: "THE TWIN TRIALS",
      title: "Wisdom & Archery",
      text: "Under Valmiki's guidance, Luv and Kush are tested in three trials: the Path of Wisdom, the Test of Precision and the Strength of Two. Solve the puzzles, draw the bow and prove that brotherhood is the greatest strength.",
      button: "BEGIN THE TWIN TRIALS",
    },
    {
      at: { number: 11 },
      interaction: "question-of-their-father",
      eyebrow: "THE QUESTION OF THEIR FATHER",
      title: "Sita and Her Sons",
      text: "An afternoon outside Valmiki's hermitage. Lava and Kusha ask their mother about the king whose story they have been learning. Sit quietly nearby and listen.",
      button: "WITNESS THE CONVERSATION",
    },
  ],

  26: [
    {
      at: { number: 9 },
      interaction: "luv-kush",
      eyebrow: "THE SONS OF RAMA",
      title: "Luv and Kush",
      text: "Let the chronicle pass before your eyes, scene by scene, as it was carried to the court of Ayodhya by two young voices.",
      button: "WATCH THE STORY",
    },
    {
      at: { number: 17 },
      interaction: "sitas-final-journey",
      eyebrow: "THE EARTH RECEIVES SITA",
      title: "Sita's Final Journey",
      text: "Sita has spoken her final oath before the assembly. Stand among the witnesses and see what the Earth answers. Nothing here can be changed. You are only here to witness it.",
      button: "WITNESS THE FINAL JOURNEY",
    },
  ],

  27: [
    {
      at: { number: 9 },
      interaction: "impossible-choice",
      eyebrow: "A PROMISE AGAINST A KINGDOM",
      title: "The Impossible Choice",
      text: "Lakshmana guards the door, and a sage's curse threatens Ayodhya. Stand beside him in the corridor and weigh the promise he made against the people he must protect.",
      button: "FACE THE CHOICE",
    },
  ],

  28: [
    {
      at: { number: 8 },
      interaction: "the-farewell",
      eyebrow: "THE END OF RAMYUG",
      title: "The Farewell",
      text: "Rama prepares to leave his earthly kingdom. Stand among his companions as he says farewell, and witness the bond between Rama and Hanuman that no farewell can reach. Nothing here can be changed. You are only here to witness it.",
      button: "WITNESS THE FAREWELL",
    },
  ],
};

/* =========================================================
   QUIZ CARDS  (one per chapter, shown at the end)
   Numeral = chapter numeral, eyebrow = "THE Nth CHRONICLE"
========================================================= */

const QUIZ_CARDS = {
  1: {
    interaction: "quiz",
    title: "How Well Do You Remember Ayodhya?",
    text: "Five questions. The story itself contains every answer. Revisit what you witnessed before the next chapter begins.",
    button: "BEGIN THE CHRONICLE",
  },
  2: {
    interaction: "chapter2-quiz",
    title: "How Well Do You Remember the Princes?",
    text: "Eight questions. The story itself contains every answer. Revisit the making of Rama, his brothers, their education, and the first journey beyond Ayodhya.",
  },
  3: {
    interaction: "chapter3-quiz",
    title: "How Well Do You Remember the Forest?",
    text: "Eight questions. Revisit Vishvamitra, the forest teachings, Rama's first trials, Tataka, Siddhashrama, and the journey toward Mithila.",
  },
  4: {
    interaction: "chapter4-quiz",
    title: "How Well Do You Remember the Land of Videha?",
    text: "Ten questions. Revisit Mithila, Sita, Vishvamitra, the sacred bow, the marriage, and the recognition that ended the journey.",
  },
  5: {
    interaction: "chapter05-quiz",
    title: "How Well Do You Remember the Crown That Never Came?",
    text: "Ten questions. Revisit the coronation that never happened, Kaikeyi's two boons, Rama's acceptance of exile, Sita's decision, Lakshmana's farewell, and Bharata's response. The story itself contains every answer.",
  },
  6: {
    interaction: "chapter06-quiz",
    title: "How Well Do You Remember the Journey into the Forest?",
    text: "Ten questions. Revisit the crossing of the Ganga, the final days of Dasharatha, Bharata's refusal of the throne, Rama's sandals, and the kingdom held in trust. The story itself contains every answer.",
  },
  7: {
    interaction: "chapter07-quiz",
    title: "How Well Do You Remember the Forest of Dandaka?",
    text: "Ten questions. Revisit the encounters with the sages, the rescue from Viradha, the gifts of Sage Agastya, and the promise made by the great vulture king Jatayu. The story itself contains every answer.",
  },
  8: {
    interaction: "chapter08-quiz",
    title: "How Well Do You Remember the Abduction of Sita?",
    text: "Ten questions. Revisit Rama's battle against the fourteen thousand rakshasas, Maricha's golden illusion, the separation at Panchavati, Ravana's abduction of Sita, and Jatayu's final act of courage. The story itself contains every answer.",
  },
  9: {
    interaction: "chapter-nine-quiz",
    title: "How Well Do You Know the Meeting with Hanuman?",
    text: "Five questions. Revisit Hanuman's first meeting with Rama and Lakshmana, his mission from Sugriva, his remarkable speech, and the wisdom that revealed his extraordinary character.",
  },
  11: {
    interaction: "chapter11-quiz",
    title: "How Well Do You Remember the Search for Sita?",
    text: "Ten questions. Revisit Sugriva's promise, the four expeditions, the hidden garden, Sampati's revelation and the discovery that Sita is in Lanka.",
  },
  12: {
    interaction: "chapter12-quiz",
    title: "The Trial of Memory",
    text: "From the shores of the great ocean to the golden city of Lanka, remember the encounters, choices and promises that shaped Hanuman's extraordinary journey.",
    button: "BEGIN THE QUIZ",
  },
  13: {
    interaction: "chapter13-quiz",
    title: "The Journey Remembered",
    text: "From Rama's appeal to the ocean to the completion of the great bridge, revisit the devotion, determination and collective effort that carried the Vanara army toward Lanka.",
    button: "BEGIN THE QUIZ",
  },
  14: {
    interaction: "chapter14-quiz",
    title: "How Well Do You Remember the Gates of Lanka?",
    text: "Six questions. Revisit Vibhishana's search for refuge, Rama's decision, the secrets of Lanka, the final offer of peace, and Angada's challenge in Ravana's court. The story itself contains every answer.",
  },
  15: {
    interaction: "chapter15-quiz",
    title: "How Well Do You Remember the Battle of Lanka?",
    text: "Five questions. Revisit the opening battles, Indrajit's Nagapasha, the suffering of Rama and Lakshmana, and Garuda's divine arrival. The story itself contains every answer.",
  },
  17: {
    interaction: "chapter17-quiz",
    title: "How Well Do You Remember the Mountain of Life?",
    text: "Ten questions. Revisit Indrajit's challenge, Hanuman's extraordinary journey to the Himalayas, and Lakshmana's recovery. The story itself contains every answer.",
  },
  23: {
    interaction: "chapter23-quiz",
    title: "How Well Do You Remember the Shadow Over Ayodhya?",
    text: "Five questions. Revisit the rumours in Ayodhya, Rama's difficult command, Sita's departure across the Ganga, Valmiki's revelation, and the birth of Lava and Kusha. The story itself contains every answer.",
    button: "BEGIN THE CHRONICLE",
  },
  25: {
    interaction: "chapter25-quiz",
    title: "How Well Do You Remember the Horse of the Ashvamedha?",
    text: "Ten questions. Revisit the great royal rite, Shatrughna's expedition, the declaration carried by the horse, and the two young princes who challenged Ayodhya. The story itself contains every answer.",
    button: "BEGIN THE CHRONICLE",
  },
  27: {
    interaction: "chapter27-quiz",
    title: "How Well Do You Remember the Last Days of Rama?",
    text: "Ten questions. Revisit the message of Time, the promise Lakshmana guarded, the sage at the door, and the farewell that followed. The story itself contains every answer.",
    button: "BEGIN THE CHRONICLE",
  },
  28: {
    interaction: "chapter28-quiz",
    title: "How Well Do You Remember the End of Ramyug?",
    text: "Five questions. Revisit Rama's final decision, his words to his sons, Hanuman's blessing, the road to the Sarayu, and the departure that closed an age. The story itself contains every answer.",
    button: "BEGIN THE CHRONICLE",
  },
};

/* =========================================================
   INTERACTION REGISTRY
   interaction id → what the modal renders
========================================================= */

const noop = () => {};

const INTERACTION_VIEWS = {
  /* Chapter I */
  "rite": (close) => <PutrakameshtiGame onComplete={close} />,

  /* Chapter II */
  "training": (close) => <PrinceTrainingGame onComplete={close} />,
  "fathers-dilemma": (close) => <FathersDilemmaGame onComplete={close} />,

  /* Chapter III */
  "forest-listening": (close) => <ForestListeningGame onComplete={close} />,
  "tataka": (close) => <TatakaGame onComplete={close} />,

  /* Chapter IV */
  "gardens-of-mithila": (close) => <GardensOfMithilaGame onComplete={close} />,
  "memory-of-a-sage": (close) => <MemoryOfASageGame onComplete={close} />,
  "sacred-bow": (close) => <SacredBowGame onComplete={close} />,
  /* NOTE: WeddingGame calls onComplete when its finale (lotus + replay) appears,
     so only onClose is passed; wiring onComplete to `close` would shut the modal
     before the finale is seen. The X button, the finale's close button and Esc
     all call onClose. */
  "wedding": (close) => <WeddingGame onClose={close} />,
  "second-bow": (close) => <SecondBowGame onComplete={close} />,

  /* Chapter V */
  /* Used in Chapter V and Chapter XXII.
     NOTE: only onExit is passed. The game fires onComplete the moment
     "Reveal Ayodhya" is pressed, so wiring it to `close` would shut the
     modal before the finale is seen. The finale's "Return to the chronicle"
     button and Esc both call onExit. */
  "prepare-coronation": (close) => <PrepareCoronationGame onExit={close} />,
  "manthara-counsel": (close) => (
    <MantharaCounselGame onComplete={close} onExit={close} />
  ),
  "lakshmana-urmila": (close) => (
    <LakshmanaUrmila onComplete={close} onExit={close} />
  ),

  /* Chapter VI */
  "the-other-shore": (close) => <TheOtherShoreGame onComplete={close} />,
  "chitrakuta-home": (close) => <AHomeInChitrakuta onComplete={close} />,
  "kingdom-held-in-trust": (close) => <AKingdomHeldInTrust onComplete={close} />,

  /* Chapter VII */
  "viradha-rescue": (close) => <ViradhaRescueGame onClose={close} />,
  "agastya-gifts": (close) => <AgastyaGiftsGame onClose={close} />,
  "jatayu": (close) => <JatayuGame onClose={close} />,

  /* Chapter VIII */
  "fourteen-thousand": (close) => <FourteenThousandGame onClose={close} />,
  "golden-illusion": (close) => <GoldenIllusionGame onClose={close} />,
  "jatayu-last-flight": (close) => <JatayuLastFlightGame onClose={close} />,

  /* Chapter IX */
  "jatayu-testimony": (close) => (
    <JatayuLastTestimony onComplete={close} onExit={close} />
  ),

  /* Chapter X */
  "promise-of-fire": (close) => <PromiseOfFire onComplete={close} onExit={close} />,
  "seven-sal-trees": (close) => <SevenSalTrees onComplete={close} onExit={close} />,
  "vali-sugriva-cinematic": (close) => (
    <ValiSugrivaCinematic onComplete={close} onExit={close} />
  ),

  /* Chapter XI */
  "kings-living-map": (close) => <KingsLivingMap onComplete={close} onExit={close} />,
  "hidden-passage-maze": (close) => <HiddenPassageMaze onExit={close} />,
  "two-brothers-one-sky": (close) => (
    <TwoBrothersOneSky onComplete={close} onExit={close} />
  ),

  /* Chapter XII */
  "hanuman-awakening": (close) => (
    <HanumanAwakeningGame onComplete={close} onClose={close} />
  ),
  "sita-hanuman-meeting": (close) => <SitaHanumanMeetingGame onComplete={close} />,
  "lanka-dahan": (close) => <LankaDahanGame onComplete={close} />,

  /* Chapter XIII */
  "ram-setu": (close) => <RamSetuGame onComplete={close} onClose={close} />,

  /* Chapter XIV */
  "vibhishana-refuge": (close) => (
    <VibhishanaRefugeGame onComplete={close} onExit={close} />
  ),
  "angada-challenge": (close) => (
    <AngadaChallengeGame onComplete={close} onExit={close} />
  ),

  /* Chapter XV */
  "assault-on-lanka": (close) => (
    <AssaultOnLankaGame onComplete={close} onExit={close} />
  ),
  "garuda-arrival": (close) => <GarudaArrivalGame onComplete={close} onExit={close} />,

  /* Chapter XVI */
  "awaken-kumbhakarna": (close) => (
    <KumbhakarnaAwakening onComplete={close} onExit={close} />
  ),
  "hanuman-kumbhakarna": (close) => (
    <HanumanKumbhakarnaGame onComplete={close} onExit={close} />
  ),
  "kumbhakarna-final-battle": (close) => (
    <KumbhakarnaFinalBattle onComplete={close} onExit={close} />
  ),

  /* Chapter XVII */
  "indrajit-promise": (close) => (
    <IndrajitPromiseGame onComplete={close} onExit={close} />
  ),
  "mountain-of-life": (close) => (
    <MountainOfLifeGame onComplete={close} onExit={close} />
  ),

  /* Chapter XVIII
     NOTE: only onClose is passed. FathersLossGame fires onComplete the
     moment its ending title appears, so wiring it to `close` would shut
     the modal before the player sees the final title card. The end
     screen's "Return" button and the X / Esc all call onClose. */
    /* Chapter XVIII */
  "nikumbhila-ritual": (close) => <NikumbhilaRitual onContinue={close} />,
  "lakshmana-vs-indrajit": (close) => (
  <LakshmanaVsIndrajit onComplete={close} onExit={close} />
),
  "fathers-loss": (close) => <FathersLossGame onClose={close} />,

  /* Chapter XIX */
   "jambavan-ravana": (close) => (
    <JambavanRavanaGame onComplete={close} onExit={close} />
  ),
  "art-of-war": (close) => (
    <ArtOfWarGame onComplete={close} onExit={close} />
  ),
  "last-words": (close) => (
    <TheLastWords onComplete={close} onExit={close} />
  ),

  /* Chapter XX
     NOTE: only onReturn is passed. TheMessageOfHope fires onComplete when its
     ending screen appears, so wiring it to `close` would shut the modal before
     the player sees the ending. The "Return to Chapter XX" button calls onReturn. */
  "message-of-hope": (close) => <TheMessageOfHope onReturn={close} />,

  /* Chapter XX — Part I of the final battle (2-minute non-interactive duel).
     Both onExit and onComplete simply close the modal; the duel ends on
     "…and the battle continues". */
  "rama-ravana-duel": (close) => <RamaRavanaDuel onExit={close} onComplete={close} />,

  /* Chapter XX — Part II of the final battle (65-second non-interactive duel,
     placed after scene 10). Plays /audio/ramayana_theme.mp3 throughout. */
  "rama-ravana-duel-2": (close) => <RamaRavanaDuelPart2 onExit={close} onComplete={close} />,

  /* Chapter XXI
     NOTE: FamilyReunited calls onComplete only from the end screen's
     "Return to the chronicle" button, so it is safe to wire to `close`.
     onExit is the X button in the header. */
  "family-reunited": (close) => <FamilyReunited onComplete={close} onExit={close} />,

  /* Chapter XXII
     NOTE: DutyOfTheCrownGame calls onComplete only from the ending screen's
     "Return to the Chronicle" button, so it is safe to wire to `close`. */
  "duty-of-the-crown": (close) => <DutyOfTheCrownGame onComplete={close} />,

  /* Chapter XXIII
     NOTE: SitaLakshmana calls onComplete only from the closing screen's
     "Continue the story" button; onExit is the X button / Esc. */
  "sita-lakshmana": (close) => <SitaLakshmana onComplete={close} onExit={close} />,

  /* Chapter XXIV — Game 1 (after Scene 6)
     NOTE: TwinTrialsGame is a full 3D game. onComplete fires when the results
     screen appears (so it must NOT close the game); the results screen's
     "Return to chapter" button and the pause menu's exit call onExit. */
  "twin-trials": (close) => <TwinTrialsGame onComplete={noop} onExit={close} />,

  /* Chapter XXIV
     NOTE: QuestionOfTheirFatherGame is a non-interactive cinematic conversation.
     onComplete is called only from the end card's "Return to the chapter" button,
     and onClose is the small X, so both are safe to wire to `close`. */
  "question-of-their-father": (close) => (
    <QuestionOfTheirFatherGame onComplete={close} onClose={close} />
  ),

  /* Chapter XXVI
     NOTE: LuvKushGame is a non-interactive 3-minute cinematic slideshow synced to
     /audio/luvkush.mp3. It calls onComplete after the final fade-out, and onExit
     is the X button / Esc, so both are safe to wire to `close`. */
  "luv-kush": (close) => <LuvKushFromChapters onComplete={close} onExit={close} />,

  /* Chapter XXVI — Game 2 (after Scene 17, before Scene 18)
     NOTE: SitasFinalJourney is a non-interactive cinematic. onComplete is called only
     from the ending screen's CONTINUE button, and onClose is the small X, so both
     are safe to wire to `close`. Scene 18 then delivers the concluding narration. */
  "sitas-final-journey": (close) => <SitasFinalJourney onComplete={close} onClose={close} />,

  /* Chapter XXVII — Game 1 (after Scene 9, before Scene 10)
     NOTE: onComplete fires only from the final reflection's
     "Return to the chapter" button; onExit is the X. Both are safe to
     wire to `close`. */
  "impossible-choice": (close) => <ImpossibleChoiceGame onComplete={close} onExit={close} />,

  /* Chapter XXVIII — Game 1 (after Scene 8)
     NOTE: The Farewell is a non-interactive cinematic. onComplete fires only from
     the ending screen's "Return to the chapter" button; onExit is the X / Esc.
     Both are safe to wire to `close`. */
  "the-farewell": (close) => <TheFarewell onComplete={close} onExit={close} />,

  /* Quizzes */
  "quiz": (close) => <Chapter01Quiz onComplete={close} />,
  "chapter2-quiz": (close) => <Chapter02Quiz onComplete={close} />,
  "chapter3-quiz": (close) => <Chapter03Quiz onComplete={close} />,
  "chapter4-quiz": (close) => <Chapter04Quiz onComplete={close} />,
  "chapter05-quiz": (close) => <Chapter05Quiz onComplete={noop} onClose={close} />,
  "chapter06-quiz": (close) => <Chapter06Quiz onComplete={noop} onClose={close} />,
  "chapter07-quiz": (close) => <Chapter07Quiz onClose={close} />,
  "chapter08-quiz": (close) => <Chapter08Quiz onComplete={noop} onClose={close} />,
  "chapter-nine-quiz": (close) => <Chapter09Quiz onComplete={close} onExit={close} />,
  "chapter11-quiz": (close) => <Chapter11Quiz onComplete={close} onClose={close} />,
  "chapter12-quiz": (close) => <Chapter12Quiz onComplete={close} onClose={close} />,
  "chapter13-quiz": (close) => <Chapter13Quiz onComplete={close} onClose={close} />,
  "chapter14-quiz": (close) => <Chapter14Quiz onClose={close} />,
  "chapter15-quiz": (close) => <Chapter15Quiz onComplete={close} onClose={close} />,
  "chapter17-quiz": (close) => <Chapter17Quiz onComplete={close} onClose={close} />,
  "chapter23-quiz": (close) => (
    <Chapter23Quiz onComplete={close} onClose={close} />
  ),
  "chapter25-quiz": (close) => (
    <Chapter25Quiz onComplete={close} onClose={close} />
  ),
  "chapter27-quiz": (close) => (
    <Chapter27Quiz onComplete={close} onClose={close} />
  ),
  "chapter28-quiz": (close) => (
    <Chapter28Quiz onComplete={close} onClose={close} />
  ),

};

/* =========================================================
   UNIFIED INTERACTION CARD
   Every game and every quiz title card uses this component
   and the shared `.chapter-interaction` styles.
========================================================= */

function InteractionCard({
  kind,
  eyebrow,
  numeral,
  title,
  text,
  button,
  footer,
  onOpen,
}) {
  const isQuiz = kind === "quiz";
  const Icon = isQuiz ? BookOpen : Sparkles;

  return (
    <motion.section
      className="chapter-interaction"
      data-kind={kind}
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="chapter-interaction__corner chapter-interaction__corner--tl"
        aria-hidden="true"
      />
      <span
        className="chapter-interaction__corner chapter-interaction__corner--tr"
        aria-hidden="true"
      />
      <span
        className="chapter-interaction__corner chapter-interaction__corner--bl"
        aria-hidden="true"
      />
      <span
        className="chapter-interaction__corner chapter-interaction__corner--br"
        aria-hidden="true"
      />

      <div className="chapter-interaction__halo" aria-hidden="true" />

      <div className="chapter-interaction__badge">
        {isQuiz ? "TEST YOUR MEMORY" : "INTERACTIVE GAME"}
      </div>

      <div className="chapter-interaction__eyebrow">
        <Icon size={13} strokeWidth={1.2} />
        <span>{eyebrow}</span>
      </div>

      <div className="chapter-interaction__number">{numeral}</div>

      <h3 className="chapter-interaction__title">{title}</h3>

      <p className="chapter-interaction__text">{text}</p>

      <div className="chapter-interaction__rule" aria-hidden="true">
        <i />
        <span>✦</span>
        <i />
      </div>

      <button
        type="button"
        className="chapter-interaction__button"
        onClick={onOpen}
      >
        <span>{button}</span>
        <ArrowRight size={16} strokeWidth={1.2} />
      </button>

      <small className="chapter-interaction__footer">{footer}</small>
    </motion.section>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RamayanaChapterDetail() {
  const { chapterId } = useParams();

  const chapter = chapters[chapterId];

  const [activeInteraction, setActiveInteraction] = useState(null);

  /* =======================================================
     INVALID CHAPTER
  ======================================================= */

  if (!chapter) {
    return (
      <main className="ramayana-chapter-detail ramayana-chapter-detail--not-found">
        <div className="ramayana-chapter-detail__not-found">
          <span>ANCESTRA</span>

          <h1>CHAPTER NOT FOUND</h1>

          <Link to={CHAPTERS_INDEX_PATH}>
            <ArrowLeft size={16} strokeWidth={1.3} />
            RETURN TO CHAPTERS
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     CHAPTER INFORMATION
  ======================================================= */

  const romanNumber = /^[IVXLCDM]+$/.test(chapter.number)
    ? chapter.number
    : toRoman(Number(chapter.number));

  const currentChapterNumber = Number(chapterId);
  const nextChapterNumber = currentChapterNumber + 1;
  const hasNextChapter = Boolean(chapters[nextChapterNumber]);

  const chapterFooter = `Chapter ${romanNumber} · ${chapter.title}`;

  /* Game cards for this chapter (numeral by order) */
  const gameCards = (GAME_CARDS[currentChapterNumber] || []).map(
    (card, i) => ({ ...card, numeral: toRoman(i + 1) })
  );

  /* Quiz card for this chapter (if any) */
  const quizCard = QUIZ_CARDS[currentChapterNumber] || null;

  const cardMatchesScene = (card, scene, index) =>
    "index" in card.at
      ? index === card.at.index
      : Number(scene.number) === card.at.number;

  /* =======================================================
     OPEN / CLOSE INTERACTION
  ======================================================= */

  const openInteraction = (interaction) => {
    setActiveInteraction(interaction);
  };

  const closeInteraction = () => {
    setActiveInteraction(null);
  };

  const renderInteraction = () => {
    const view = INTERACTION_VIEWS[activeInteraction];
    return view ? view(closeInteraction) : null;
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="ramayana-chapter-detail">

      {/* ATMOSPHERE */}

      <div className="ramayana-chapter-detail__glow" />

      <div className="ramayana-chapter-detail__geometry">
        <span />
        <span />
        <span />
      </div>

      {/* HEADER */}

      <header className="ramayana-chapter-detail__header">

        <Link
          to={CHAPTERS_INDEX_PATH}
          className="ramayana-chapter-detail__back"
        >
          <ArrowLeft size={16} strokeWidth={1.3} />
          <span>ALL CHAPTERS</span>
        </Link>

        <div className="ramayana-chapter-detail__brand">
          ANCESTRA
        </div>

        <div className="ramayana-chapter-detail__chapter-number">
          CHAPTER {romanNumber}
        </div>

      </header>

      {/* HERO */}

      <section className="ramayana-chapter-detail__hero">

        <span className="ramayana-chapter-detail__corner ramayana-chapter-detail__corner--tl" />
        <span className="ramayana-chapter-detail__corner ramayana-chapter-detail__corner--tr" />
        <span className="ramayana-chapter-detail__corner ramayana-chapter-detail__corner--bl" />
        <span className="ramayana-chapter-detail__corner ramayana-chapter-detail__corner--br" />

        <div className="ramayana-chapter-detail__hero-content">

          <motion.span
            className="ramayana-chapter-detail__kanda"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            {chapter.kanda}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.1,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {chapter.title}
          </motion.h1>

          <motion.div
            className="ramayana-chapter-detail__ornament"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.55 }}
          >
            <i />
            <span>✦</span>
            <i />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7 }}
          >
            {chapter.opening}
          </motion.p>

        </div>

        <div className="ramayana-chapter-detail__scroll">
          <span>SCROLL</span>
          <div className="ramayana-chapter-detail__scroll-line" />
        </div>

      </section>

      {/* THEME */}

      <section className="ramayana-chapter-detail__theme">
        <span>THEME</span>
        <p>{chapter.theme}</p>
      </section>

      {/* SCENES (+ game cards placed after their scene) */}

      <section className="ramayana-chapter-detail__scenes">

        {chapter.scenes.map((scene, index) => (
          <div key={scene.id}>

            <motion.article
              className={`ramayana-scene${
                index === chapter.scenes.length - 1
                  ? " ramayana-scene--last"
                  : ""
              }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >

              <div className="ramayana-scene__header">
                <span className="ramayana-scene__eyebrow">
                  {scene.eyebrow}
                </span>

                <span className="ramayana-scene__number">
                  {scene.number}
                </span>
              </div>

              <div className="ramayana-scene__image-wrap">
                <div className="ramayana-scene__image-frame">
                  <img
                    src={scene.image}
                    alt={scene.title}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              </div>

              <div className="ramayana-scene__content">

                <span className="ramayana-scene__location">
                  {scene.location}
                </span>

                <h2>{scene.title}</h2>

                <div className="ramayana-scene__text">
                  {(
                    Array.isArray(scene.text)
                      ? scene.text
                      : typeof scene.text === "string"
                        ? [scene.text]
                        : Array.isArray(scene.text?.paragraphs)
                          ? scene.text.paragraphs
                          : []
                  ).map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
                </div>

                <div className="ramayana-scene__emotion">
                  <span>✦</span>
                  <p>{scene.emotion}</p>
                </div>

              </div>

            </motion.article>

            {/* GAME CARDS FOR THIS SCENE */}

            {gameCards
              .filter((card) => cardMatchesScene(card, scene, index))
              .map((card) => (
                <InteractionCard
                  key={card.interaction}
                  kind="game"
                  eyebrow={card.eyebrow}
                  numeral={card.numeral}
                  title={card.title}
                  text={card.text}
                  button={card.button}
                  footer={chapterFooter}
                  onOpen={() => openInteraction(card.interaction)}
                />
              ))}

          </div>
        ))}

      </section>

      {/* QUIZ — ONE AT THE END OF EACH CHAPTER */}

      {quizCard && (
        <InteractionCard
          kind="quiz"
          eyebrow={`THE ${ORDINALS[currentChapterNumber] || ""} CHRONICLE`.replace("  ", " ")}
          numeral={romanNumber}
          title={quizCard.title}
          text={quizCard.text}
          button={quizCard.button || "ENTER THE QUIZ"}
          footer={chapterFooter}
          onOpen={() => openInteraction(quizCard.interaction)}
        />
      )}

      {/* END OF CHAPTER */}

      <section className="ramayana-chapter-detail__end">

        <span>END OF CHAPTER {romanNumber}</span>

        <div className="ramayana-chapter-detail__end-ornament">
          <i />
          <span>✦</span>
          <i />
        </div>

        {hasNextChapter ? (
          <Link
            to={`/journey/ramayana/chapters/${nextChapterNumber}`}
            className="ramayana-chapter-detail__next"
          >
            NEXT CHAPTER
            <ArrowRight size={17} strokeWidth={1.3} />
          </Link>
        ) : (
          <Link
            to={CHAPTERS_INDEX_PATH}
            className="ramayana-chapter-detail__next"
          >
            ALL CHAPTERS
            <ArrowRight size={17} strokeWidth={1.3} />
          </Link>
        )}

        <Link
          to={CHAPTERS_INDEX_PATH}
          className="ramayana-chapter-detail__return"
        >
          RETURN TO CHRONICLE
        </Link>

      </section>

      {/* SINGLE INTERACTION MODAL */}

      <InteractionModal
        isOpen={Boolean(activeInteraction)}
        onClose={closeInteraction}
      >
        {renderInteraction()}
      </InteractionModal>

    </main>
  );
}