import { motion } from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Flower2,
  Hammer,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Swords,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import "./RamayanaCharacterDetail.css";

/* =========================================================
   ANCESTRA — RAMAYANA CHARACTER DETAIL

   ORDER:
   RAMA
   LAKSHMANA
   BHARATA
   SHATRUGHNA
   DASHARATHA
   KAUSHALYA
   KAIKEYI
   SUMITRA
   MANTHARA
   SITA
   JANAKA
   SUNAINA
   URMILA
   MANDAVI
   SHRUTAKIRTI
   VISHVAMITRA
   VASHISHTHA
   AGASTYA
   SHABARI
   PARASHURAMA
   HANUMAN
   SUGRIVA
   VALI
   TARA
   ANGADA
   JAMBAVAN
   NALA
   NILA
   JATAYU
   SAMPATI
   RAVANA
   KUMBHAKARNA
   VIBHISHANA
   INDRAJIT
   MANDODARI
   SURPANAKHA
   KHARA
   DUSHANA
   MARICHA
   SUBAHU
========================================================= */


/* =========================================================
   CHARACTER DATA
========================================================= */

const characters = [

  /* =======================================================
     I. AYODHYA
  ======================================================= */

  {
    id: "rama",
    role: "THE EXILED PRINCE",
    name: "RAMA",
    group: "AYODHYA",
    symbol: "feather",
    symbolLabel: "THE BOW OF DHARMA",

    intro:
      "Rama, prince of Ayodhya and eldest son of Dasharatha, stands at the heart of the Ramayana as an embodiment of dharma, restraint, courage and unwavering responsibility.",

    story: [
      "Born to King Dasharatha and Queen Kaushalya, Rama grew into the beloved prince of Ayodhya and was prepared to inherit the throne. His life changed when Kaikeyi invoked the two promises granted to her by Dasharatha and demanded Rama's exile into the forest. Rather than resist, Rama accepted the fourteen-year exile in order to preserve his father's word and the integrity of the royal house.",

      "Rama entered the forest accompanied by Sita and Lakshmana. What began as an act of obedience eventually became a far greater journey. The abduction of Sita by Ravana transformed Rama's exile into a struggle against Lanka. He formed an alliance with Sugriva, earned the devotion of Hanuman, gathered the Vanara forces and crossed toward Lanka.",

      "The confrontation with Ravana became the defining conflict of Rama's journey. Through the war and its aftermath, Rama's character is repeatedly tested by questions of duty, kingship, compassion, justice and personal sacrifice."
    ],

    qualities: [
      "Unwavering commitment to dharma",
      "Extraordinary discipline and self-control",
      "Mastery of the bow and divine weapons",
      "Compassion toward allies and those seeking refuge",
      "Courage in the face of immense adversity"
    ],

    legacy:
      "Rama's story became one of the epic's deepest examinations of duty, sacrifice and kingship. His choices repeatedly place responsibility above personal comfort, making his journey central to the Ramayana's understanding of dharma."
  },

  {
    id: "lakshmana",
    role: "THE DEVOTED BROTHER",
    name: "LAKSHMANA",
    group: "AYODHYA",
    symbol: "swords",
    symbolLabel: "THE VIGILANT WARRIOR",

    intro:
      "Lakshmana, younger brother of Rama, represents loyalty carried into action. His devotion was expressed through service, vigilance and an extraordinary willingness to sacrifice personal comfort.",

    story: [
      "When Rama was sent into exile, Lakshmana immediately chose to accompany him. He left behind the security of Ayodhya and entered the forest with Rama and Sita, accepting the hardships of exile as his own duty.",

      "Throughout the fourteen years, Lakshmana served as protector, companion and warrior. He remained constantly alert to dangers surrounding Rama and Sita and participated in many of the defining encounters of the forest journey.",

      "His fierce loyalty eventually carried him into the war with Lanka, where he fought some of Ravana's strongest warriors. His confrontation with Indrajit became one of the decisive moments of the campaign."
    ],

    qualities: [
      "Absolute loyalty toward Rama",
      "Fearless warrior and protector",
      "Discipline and vigilance",
      "Self-sacrifice",
      "Strong sense of familial duty"
    ],

    legacy:
      "Lakshmana demonstrates that devotion can take the form of service, vigilance and sacrifice. His life beside Rama gives the epic one of its strongest portrayals of brotherhood."
  },

  {
    id: "bharata",
    role: "THE RELUCTANT KING",
    name: "BHARATA",
    group: "AYODHYA",
    symbol: "crown",
    symbolLabel: "THE EMPTY THRONE",

    intro:
      "Bharata, son of Dasharatha and Kaikeyi, stands as one of the Ramayana's clearest examples of renunciation, loyalty and devotion to rightful duty.",

    story: [
      "Bharata was away from Ayodhya when Kaikeyi demanded Rama's exile and secured the throne for her son. When Bharata returned and discovered what had happened, he was horrified. He rejected the throne because it had come through Rama's suffering.",

      "Bharata travelled into the forest to meet Rama and pleaded with him to return to Ayodhya. Rama refused because he was bound by Dasharatha's promise. Bharata then accepted Rama's sandals as the symbol of his authority and returned to Ayodhya.",

      "Rather than ruling as an independent king, Bharata governed as Rama's representative, treating the throne as something entrusted to him rather than something he personally possessed."
    ],

    qualities: [
      "Humility before rightful duty",
      "Deep devotion toward Rama",
      "Rejection of undeserved power",
      "Moral courage",
      "Self-restraint"
    ],

    legacy:
      "Bharata demonstrates that kingship is not simply possession of a throne. His refusal to benefit from Rama's exile makes him one of the epic's clearest examples of principled leadership."
  },

  {
    id: "shatrughna",
    role: "THE SILENT WARRIOR",
    name: "SHATRUGHNA",
    group: "AYODHYA",
    symbol: "shield",
    symbolLabel: "THE STEADFAST BROTHER",

    intro:
      "Shatrughna, the youngest son of Dasharatha, occupies a quieter place within the epic while remaining a loyal and capable member of the House of Raghu.",

    story: [
      "Shatrughna was especially close to Bharata and remained associated with him during the turbulent period following Rama's exile. His role within the royal family was often one of service rather than public prominence.",

      "Later, Shatrughna undertook military responsibilities of his own. He confronted and defeated Lavanasura and established Mathura, demonstrating that the youngest prince possessed considerable strength and leadership.",

      "His story reveals that importance within an epic does not always require constant presence at its center."
    ],

    qualities: [
      "Quiet loyalty",
      "Military courage",
      "Devotion toward Bharata",
      "Discipline",
      "Readiness to serve without seeking glory"
    ],

    legacy:
      "Shatrughna represents the quieter forms of duty within the royal family. His story reminds us that not every important contribution in an epic is placed at its center."
  },

  {
    id: "dasharatha",
    role: "THE KING OF AYODHYA",
    name: "DASHARATHA",
    group: "AYODHYA",
    symbol: "crown",
    symbolLabel: "THE KING OF AYODHYA",

    intro:
      "Dasharatha, great king of Ayodhya and father of Rama, carried the authority, expectations and promises of the ancient House of Raghu.",

    story: [
      "Dasharatha was an experienced ruler and warrior who had long desired a worthy heir. Rama's popularity and character made him the natural choice for succession, and Dasharatha prepared to install him as king.",

      "The planned coronation collapsed when Kaikeyi invoked two promises Dasharatha had granted her. Bound by his own word, the king was forced to send Rama into exile and place Bharata on the throne.",

      "Dasharatha's love for Rama became inseparable from his grief. Unable to bear the separation, he eventually died, leaving Ayodhya to face the consequences of his promises."
    ],

    qualities: [
      "Royal authority",
      "Devotion toward his sons",
      "Commitment to his promises",
      "Military experience",
      "Deep emotional vulnerability"
    ],

    legacy:
      "Dasharatha's life illustrates the tension between personal love and the uncompromising demands of a king's word. His promise to Kaikeyi becomes one of the pivotal causes of the epic's central journey."
  },

  {
    id: "kaushalya",
    role: "THE QUEEN MOTHER",
    name: "KAUSHALYA",
    group: "AYODHYA",
    symbol: "crown",
    symbolLabel: "THE QUEEN MOTHER",

    intro:
      "Kaushalya, principal queen of Dasharatha and mother of Rama, embodies maternal devotion, dignity and endurance through the most painful transformations of Ayodhya.",

    story: [
      "Kaushalya experienced the joy of seeing Rama prepared for kingship and the devastation that followed when his coronation was cancelled. Rama's exile transformed the palace from celebration into grief.",

      "Despite the emotional cost of separation, Kaushalya remained a dignified presence within Ayodhya. Her relationship with Rama represents one of the epic's deepest familial bonds.",

      "Her experience also reveals the human cost of political decisions, showing that the consequences of exile reached far beyond the individual who entered the forest."
    ],

    qualities: [
      "Maternal devotion",
      "Royal dignity",
      "Emotional strength",
      "Compassion",
      "Patience through suffering"
    ],

    legacy:
      "Kaushalya represents the silent emotional strength behind Rama's journey. Her grief gives the exile a human cost beyond politics and royal succession."
  },

  {
    id: "kaikeyi",
    role: "THE QUEEN OF AYODHYA",
    name: "KAIKEYI",
    group: "AYODHYA",
    symbol: "crown",
    symbolLabel: "THE TWO BOONS",

    intro:
      "Kaikeyi, one of Dasharatha's queens and mother of Bharata, becomes one of the most consequential figures in the political transformation of Ayodhya.",

    story: [
      "Kaikeyi had once been deeply loved by Dasharatha and had earned two promises after assisting him in battle. When Rama's coronation was announced, Manthara convinced Kaikeyi that Bharata's future was threatened.",

      "Kaikeyi therefore demanded that Bharata receive the throne and that Rama spend fourteen years in exile. Dasharatha was devastated, but his promise bound him to fulfill her demands.",

      "Although Kaikeyi's decision caused immense suffering, it became the event that set Rama's forest journey and the later conflict with Lanka into motion."
    ],

    qualities: [
      "Political awareness",
      "Strong maternal attachment",
      "Determination",
      "Royal influence",
      "Complex moral choices"
    ],

    legacy:
      "Kaikeyi is a reminder that the course of an epic can change through a single decision. Her two demands become the doorway through which Rama's exile begins."
  },

  {
    id: "sumitra",
    role: "THE WISE QUEEN",
    name: "SUMITRA",
    group: "AYODHYA",
    symbol: "crown",
    symbolLabel: "THE WISE QUEEN",

    intro:
      "Sumitra, mother of Lakshmana and Shatrughna, is remembered for wisdom, composure and her deep understanding of duty within the royal family.",

    story: [
      "When Lakshmana chose to accompany Rama into exile, Sumitra did not allow maternal fear to override her understanding of his purpose. She accepted that her son's devotion was itself an expression of duty.",

      "Her guidance helped Lakshmana understand his role as protector and companion. Instead of asking him to remain behind, she encouraged him to serve Rama wholeheartedly.",

      "Her strength therefore appears not through political authority but through the wisdom to recognize when love must support a difficult path."
    ],

    qualities: [
      "Wisdom",
      "Maternal strength",
      "Understanding of dharma",
      "Selflessness",
      "Emotional composure"
    ],

    legacy:
      "Sumitra's strength lies in understanding when love must release rather than possess. Her guidance becomes an important foundation for Lakshmana's life of service."
  },

  {
    id: "manthara",
    role: "THE INSTIGATOR",
    name: "MANTHARA",
    group: "AYODHYA",
    symbol: "scroll",
    symbolLabel: "THE TURNING POINT",

    intro:
      "Manthara, Kaikeyi's attendant, occupies a small but decisive position in the political chain of events that transformed Rama's destiny and the future of Ayodhya.",

    story: [
      "When preparations were being made for Rama's coronation, Manthara perceived the event as a threat to Kaikeyi and Bharata's position. She repeatedly warned Kaikeyi that Rama's rise would leave Bharata without influence.",

      "Her counsel persuaded Kaikeyi to invoke the promises granted by Dasharatha. The resulting demands sent Rama into exile and overturned the planned succession.",

      "Although Manthara never held the authority of a queen or king, her influence demonstrates how a single voice within a palace can redirect the destiny of an entire kingdom."
    ],

    qualities: [
      "Political influence",
      "Persuasive speech",
      "Strategic thinking",
      "Suspicion",
      "Ability to influence royal decisions"
    ],

    legacy:
      "Manthara demonstrates how influence does not always come from a throne. A single voice within a palace can redirect the destiny of an entire kingdom."
  },


  /* =======================================================
     II. MITHILA

     IMPORTANT:
     SITA IS AFTER MANTHARA.
  ======================================================= */

  {
    id: "sita",
    role: "THE DIVINE QUEEN",
    name: "SITA",
    group: "MITHILA",
    symbol: "flower",
    symbolLabel: "THE DAUGHTER OF EARTH",

    intro:
      "Sita, princess of Mithila and queen of Rama, stands among the Ramayana's most enduring figures, embodying grace, courage, purity, inner strength and unwavering resolve.",

    story: [
      "Sita was discovered by King Janaka while he was preparing the earth for a sacred rite and was raised as the princess of Mithila. Her marriage to Rama joined the royal houses of Mithila and Ayodhya and created one of the epic's most important relationships.",

      "When Rama was sent into exile, Sita chose to accompany him despite the hardships of forest life. She shared the dangers of the wilderness and remained beside Rama and Lakshmana throughout their early years of exile.",

      "Her abduction by Ravana became the central cause of the conflict with Lanka. During her captivity, Sita refused Ravana's demands and preserved her dignity and convictions despite extraordinary pressure.",

      "After the war, her story continued through difficult questions of honor, trust, public duty and destiny. Sita's importance therefore extends far beyond being Rama's queen; she is one of the epic's central figures through whom dignity, suffering, devotion and strength are explored."
    ],

    qualities: [
      "Unwavering inner strength",
      "Grace under extreme adversity",
      "Devotion without loss of dignity",
      "Moral courage",
      "Patience and resilience"
    ],

    legacy:
      "Sita's legacy reaches beyond her relationship with Rama. She remains a profound symbol of dignity under pressure, inner resolve and the strength to preserve one's convictions even when circumstances become overwhelming."
  },

  {
    id: "janaka",
    role: "THE PHILOSOPHER KING",
    name: "JANAKA",
    group: "MITHILA",
    symbol: "crown",
    symbolLabel: "THE PHILOSOPHER KING",

    intro:
      "Janaka, enlightened king of Mithila and father of Sita, is remembered as a ruler who combined political responsibility with philosophical wisdom and detachment.",

    story: [
      "Janaka discovered Sita while preparing the earth for a sacred rite and raised her as his daughter. His reputation as a wise and spiritually accomplished king extended far beyond Mithila.",

      "He organized the great gathering in which Rama successfully lifted the bow associated with Shiva. This event led to the marriage of Rama and Sita and united the royal houses of Mithila and Ayodhya.",

      "Janaka's character is particularly important because he represents a ruler who understands worldly responsibility without allowing political power to completely define his identity."
    ],

    qualities: [
      "Wisdom",
      "Detachment",
      "Justice",
      "Spiritual understanding",
      "Royal responsibility"
    ],

    legacy:
      "Janaka represents the ideal of the philosopher-king: a ruler capable of carrying worldly responsibilities without becoming completely consumed by them."
  },

  {
    id: "sunaina",
    role: "THE QUEEN OF MITHILA",
    name: "SUNAINA",
    group: "MITHILA",
    symbol: "flower",
    symbolLabel: "THE MOTHER OF MITHILA",

    intro:
      "Sunaina, queen of Mithila and mother of Sita, represents the compassionate and dignified presence within the household of King Janaka.",

    story: [
      "As queen and mother, Sunaina belonged to the royal household in which Sita was raised. Her role reflects the emotional and familial dimension of Mithila's court.",

      "The marriage of Sita and Rama connected Mithila with Ayodhya. Through that union, Sunaina became part of a family whose fortunes would later be transformed by Rama's exile and the war with Lanka.",

      "Although the epic gives her less narrative space than Sita or Janaka, her presence represents the maternal foundation surrounding the princess of Mithila."
    ],

    qualities: [
      "Compassion",
      "Maternal devotion",
      "Royal dignity",
      "Grace",
      "Emotional strength"
    ],

    legacy:
      "Sunaina represents the quiet strength of the maternal world surrounding Sita and the royal traditions of Mithila."
  },

  {
    id: "urmila",
    role: "THE FORGOTTEN PRINCESS",
    name: "URMILA",
    group: "MITHILA",
    symbol: "flower",
    symbolLabel: "THE SILENT SACRIFICE",

    intro:
      "Urmila, princess of Mithila and wife of Lakshmana, represents one of the quieter sacrifices surrounding Rama's fourteen-year exile.",

    story: [
      "Urmila married Lakshmana during the marriages that joined Mithila and Ayodhya. When Lakshmana chose to accompany Rama and Sita into the forest, Urmila remained behind.",

      "Her life during those years involved separation from the husband who had devoted himself entirely to Rama's service. Though she was physically absent from the forest, her sacrifice formed part of the emotional cost of Lakshmana's decision.",

      "Her story reminds us that epic journeys are sustained not only by those who travel, but also by those who remain behind."
    ],

    qualities: [
      "Patience",
      "Quiet sacrifice",
      "Loyalty",
      "Emotional resilience",
      "Selflessness"
    ],

    legacy:
      "Urmila represents the people whose sacrifices happen away from the battlefield and outside the main narrative, yet remain essential to the epic's emotional depth."
  },

  {
    id: "mandavi",
    role: "THE PRINCESS OF MITHILA",
    name: "MANDAVI",
    group: "MITHILA",
    symbol: "flower",
    symbolLabel: "THE PRINCESS OF MITHILA",

    intro:
      "Mandavi, princess of Mithila and wife of Bharata, became part of the profound connection between the houses of Mithila and Ayodhya.",

    story: [
      "Mandavi married Bharata during the marriages that united the two royal families. Her life became closely connected with the difficult events that followed Rama's exile.",

      "Bharata rejected the throne and chose to govern only as Rama's representative. Mandavi therefore belonged to a household shaped by restraint, separation and duty rather than ordinary royal privilege.",

      "Her story reflects the many family members whose lives were transformed by the choices made at the center of the epic."
    ],

    qualities: [
      "Loyalty",
      "Patience",
      "Royal dignity",
      "Family devotion",
      "Self-restraint"
    ],

    legacy:
      "Mandavi represents the women whose lives were deeply affected by the moral choices of the royal family while remaining largely outside the central action."
  },

  {
    id: "shrutakirti",
    role: "THE YOUNGEST PRINCESS",
    name: "SHRUTAKIRTI",
    group: "MITHILA",
    symbol: "flower",
    symbolLabel: "THE YOUNGEST PRINCESS",

    intro:
      "Shrutakirti, youngest princess of Mithila and wife of Shatrughna, completes the family bond between Mithila and the House of Raghu.",

    story: [
      "Shrutakirti became the wife of Shatrughna during the marriages that united the two royal houses. Her place within the family connected her to the wider events surrounding Ayodhya.",

      "Although the epic gives her less narrative space than Sita, her marriage formed part of the larger union between Mithila and Ayodhya.",

      "Her presence reminds us that the Ramayana contains many lives surrounding its central figures, even when the surviving narrative gives them less attention."
    ],

    qualities: [
      "Grace",
      "Family loyalty",
      "Royal dignity",
      "Patience",
      "Quiet strength"
    ],

    legacy:
      "Shrutakirti reminds us that the Ramayana contains many lives surrounding its central figures, even when the surviving narrative gives them less attention."
  },


  /* =======================================================
     III. SAGES & GUIDES
  ======================================================= */

  {
    id: "vishvamitra",
    role: "THE WARRIOR SAGE",
    name: "VISHVAMITRA",
    group: "SAGES & GUIDES",
    symbol: "om",
    symbolLabel: "THE SAGE OF TRANSFORMATION",

    intro:
      "Vishvamitra is one of the Ramayana's most formidable sages, a figure of immense spiritual achievement whose earlier life as a warrior king gives his story unusual depth.",

    story: [
      "Vishvamitra approached Dasharatha when Rakshasas repeatedly disrupted his sacred rites. He requested that Rama and Lakshmana accompany him and protect the rituals.",

      "Under Vishvamitra's guidance, the princes confronted supernatural adversaries and learned disciplines associated with powerful divine weapons. The journey also brought them toward Mithila.",

      "His guidance marked an important transition in Rama's life, moving him from the protected world of Ayodhya into the wider responsibilities of a warrior and future king."
    ],

    qualities: [
      "Spiritual power",
      "Determination",
      "Mastery of divine knowledge",
      "Discipline",
      "Transformative will"
    ],

    legacy:
      "Vishvamitra represents transformation through discipline. His own journey from king to sage mirrors the epic's broader interest in power, knowledge and self-mastery."
  },

  {
    id: "vashishtha",
    role: "THE ROYAL SAGE",
    name: "VASHISHTHA",
    group: "SAGES & GUIDES",
    symbol: "om",
    symbolLabel: "THE ROYAL SAGE",

    intro:
      "Vashishtha, revered royal sage of Ayodhya, served as spiritual guide and counselor to generations of the House of Raghu.",

    story: [
      "Vashishtha occupied a position of extraordinary respect within Ayodhya. His wisdom helped guide Dasharatha and the royal family through questions of succession, ritual and duty.",

      "His presence represented a spiritual authority existing alongside the political authority of the kings. The relationship between sage and ruler was therefore essential to the functioning of the royal house.",

      "Through this role, Vashishtha represents the principle that authority must remain connected to wisdom and ethical responsibility."
    ],

    qualities: [
      "Wisdom",
      "Spiritual authority",
      "Patience",
      "Guidance",
      "Knowledge of dharma"
    ],

    legacy:
      "Vashishtha represents the principle that political power requires guidance from wisdom and ethical understanding."
  },

  {
    id: "agastya",
    role: "THE GREAT SAGE",
    name: "AGASTYA",
    group: "SAGES & GUIDES",
    symbol: "om",
    symbolLabel: "THE SAGE OF THE SOUTH",

    intro:
      "Agastya is a powerful sage whose presence in the southern forests connects Rama's journey with an older spiritual tradition of wilderness and ascetic discipline.",

    story: [
      "During Rama's forest journey, Agastya welcomed him and shared knowledge concerning weapons, spiritual practice and the responsibilities of his path.",

      "The sage's guidance strengthened Rama before the later stages of his struggle with the forces of Lanka. His hermitage became one of the important spiritual landmarks of the journey.",

      "Agastya therefore represents the wisdom encountered by Rama beyond the political world of Ayodhya."
    ],

    qualities: [
      "Spiritual wisdom",
      "Knowledge",
      "Discipline",
      "Strength of character",
      "Guidance"
    ],

    legacy:
      "Agastya represents the sages who provide knowledge and direction at critical moments in Rama's journey."
  },

  {
    id: "shabari",
    role: "THE DEVOTED ASCETIC",
    name: "SHABARI",
    group: "SAGES & GUIDES",
    symbol: "om",
    symbolLabel: "THE POWER OF DEVOTION",

    intro:
      "Shabari is remembered for extraordinary simplicity and unwavering devotion, becoming one of the most intimate spiritual encounters in Rama's forest journey.",

    story: [
      "Shabari lived as an ascetic and waited for Rama because her teacher had told her that he would one day arrive. Her years of waiting became an expression of complete faith.",

      "When Rama finally reached her hermitage, she welcomed him with profound devotion. The encounter demonstrates that spiritual significance in the epic is not restricted to kings, warriors or politically powerful figures.",

      "Her story places sincere devotion at the center of spiritual life and shows how a seemingly quiet existence can carry immense meaning."
    ],

    qualities: [
      "Unwavering devotion",
      "Humility",
      "Patience",
      "Faith",
      "Simplicity"
    ],

    legacy:
      "Shabari's story emphasizes that sincere devotion can become a form of spiritual greatness regardless of worldly position."
  },

  {
    id: "parashurama",
    role: "THE WARRIOR SAGE",
    name: "PARASHURAMA",
    group: "SAGES & GUIDES",
    symbol: "om",
    symbolLabel: "THE WARRIOR SAGE",

    intro:
      "Parashurama, the legendary warrior sage, appears at a decisive moment when the world begins to recognize Rama's extraordinary strength and destiny.",

    story: [
      "Following Rama's breaking of the great bow at Mithila, Parashurama confronted the young prince. The encounter carried the weight of two generations of warrior authority meeting face to face.",

      "Rama remained composed throughout the confrontation and demonstrated that his strength was not merely physical but connected to discipline and purpose.",

      "Parashurama ultimately withdrew after recognizing Rama's significance, turning the encounter into an important symbolic transition."
    ],

    qualities: [
      "Martial power",
      "Spiritual authority",
      "Fierce determination",
      "Pride in warrior tradition",
      "Recognition of destiny"
    ],

    legacy:
      "Parashurama's encounter with Rama symbolizes a transition between generations of divine warrior traditions."
  },


  /* =======================================================
     IV. KISHKINDHA & ALLIES
  ======================================================= */

  {
    id: "hanuman",
    role: "THE DIVINE DEVOTEE",
    name: "HANUMAN",
    group: "KISHKINDHA & ALLIES",
    symbol: "feather",
    symbolLabel: "THE GADHA OF THE DEVOTEE",

    intro:
      "Hanuman is one of the Ramayana's most extraordinary figures, combining immense strength with intelligence, humility, courage and absolute devotion to Rama.",

    story: [
      "Hanuman first encountered Rama and Lakshmana while serving Sugriva. His intelligence allowed him to recognize their purpose, and he soon became one of Rama's closest and most trusted allies.",

      "Hanuman crossed the ocean toward Lanka in search of Sita and located her in Ashoka Vatika. He carried Rama's message to her and returned with vital knowledge about her situation.",

      "During the war, Hanuman repeatedly demonstrated extraordinary courage and strength. Yet his defining quality remains devotion: his immense abilities are consistently placed in service of Rama rather than personal recognition."
    ],

    qualities: [
      "Extraordinary strength",
      "Absolute devotion to Rama",
      "Intelligence and wisdom",
      "Fearless courage",
      "Humility despite immense power"
    ],

    legacy:
      "Hanuman became one of the most enduring symbols of devotion, service and courage in Indian tradition. His story demonstrates that immense power becomes meaningful when guided by humility and purpose."
  },

  {
    id: "sugriva",
    role: "THE EXILED KING",
    name: "SUGRIVA",
    group: "KISHKINDHA & ALLIES",
    symbol: "crown",
    symbolLabel: "THE KING OF KISHKINDHA",

    intro:
      "Sugriva, the exiled king of Kishkindha, became one of Rama's most important allies during the search for Sita.",

    story: [
      "Sugriva had been driven from Kishkindha after a bitter conflict with his brother Vali. Living in fear, he eventually encountered Rama and formed an alliance with him.",

      "Rama helped Sugriva reclaim his kingdom, while Sugriva promised to mobilize the Vanara forces in the search for Sita.",

      "The alliance transformed Rama's solitary struggle into an organized campaign involving thousands of warriors and scouts."
    ],

    qualities: [
      "Leadership",
      "Strategic alliance-building",
      "Determination",
      "Loyalty",
      "Ability to unite the Vanara forces"
    ],

    legacy:
      "Sugriva's story demonstrates how alliances can transform individual struggle into collective action."
  },

  {
    id: "vali",
    role: "THE MIGHTY KING",
    name: "VALI",
    group: "KISHKINDHA & ALLIES",
    symbol: "crown",
    symbolLabel: "THE MIGHTY KING",

    intro:
      "Vali, the immensely powerful king of Kishkindha, is remembered as one of the strongest Vanara warriors and one of the epic's most complex figures.",

    story: [
      "Vali possessed extraordinary physical strength and ruled Kishkindha before his conflict with Sugriva divided the kingdom. Their dispute eventually forced Sugriva into exile.",

      "Rama intervened on Sugriva's behalf and Vali was ultimately defeated. The circumstances of Vali's death remain one of the epic's most discussed moral episodes.",

      "His story raises difficult questions concerning justice, kingship, warfare and the boundaries of intervention."
    ],

    qualities: [
      "Immense physical power",
      "Royal authority",
      "Warrior confidence",
      "Courage",
      "Complex moral character"
    ],

    legacy:
      "Vali's story remains important because it refuses to make questions of justice simple. His fate invites reflection on power, duty and difficult judgments during conflict."
  },

  {
    id: "tara",
    role: "THE WISE QUEEN",
    name: "TARA",
    group: "KISHKINDHA & ALLIES",
    symbol: "flower",
    symbolLabel: "THE WISE QUEEN",

    intro:
      "Tara, queen of Kishkindha and wife of Vali, is celebrated for intelligence, foresight and her ability to understand the consequences of political decisions.",

    story: [
      "Tara recognized the danger surrounding the conflict between Vali and Sugriva and attempted to warn Vali against underestimating Rama's presence.",

      "After Vali's death, Tara remained a figure of dignity and intelligence within the changing political order of Kishkindha.",

      "Her counsel demonstrates that wisdom can exist even when those holding power refuse to listen."
    ],

    qualities: [
      "Foresight",
      "Political intelligence",
      "Courage",
      "Emotional strength",
      "Practical wisdom"
    ],

    legacy:
      "Tara represents the voice of reason during moments when pride and power threaten to overwhelm judgment."
  },

  {
    id: "angada",
    role: "THE YOUNG PRINCE",
    name: "ANGADA",
    group: "KISHKINDHA & ALLIES",
    symbol: "shield",
    symbolLabel: "THE YOUNG PRINCE",

    intro:
      "Angada, son of Vali and prince of Kishkindha, inherited a difficult legacy while becoming an important leader within Rama's alliance.",

    story: [
      "After Vali's death, Angada was placed within the new political order of Kishkindha. Despite his father's conflict with Rama, he became part of the larger mission to locate Sita.",

      "Angada participated in the search for Lanka and later served as an important warrior and representative during the campaign against Ravana.",

      "His position required him to carry the legacy of his father while serving a cause larger than his family's internal conflict."
    ],

    qualities: [
      "Courage",
      "Leadership",
      "Loyalty",
      "Political maturity",
      "Warrior discipline"
    ],

    legacy:
      "Angada demonstrates how the next generation can inherit conflict without being permanently imprisoned by it."
  },

  {
    id: "jambavan",
    role: "THE ANCIENT WARRIOR",
    name: "JAMBAVAN",
    group: "KISHKINDHA & ALLIES",
    symbol: "shield",
    symbolLabel: "THE ANCIENT WARRIOR",

    intro:
      "Jambavan, the ancient bear-warrior, represents experience, memory and wisdom within Rama's alliance.",

    story: [
      "Jambavan accompanied the Vanara forces during the search for Sita. His age and experience gave him a perspective that younger warriors lacked.",

      "When the search party reached the ocean and hesitated before the impossible distance to Lanka, Jambavan reminded Hanuman of his forgotten strength.",

      "His words awakened Hanuman's confidence and enabled the leap toward Lanka, making Jambavan's greatest contribution one of recognition rather than physical conquest."
    ],

    qualities: [
      "Ancient wisdom",
      "Strategic understanding",
      "Patience",
      "Mentorship",
      "Knowledge of hidden potential"
    ],

    legacy:
      "Jambavan represents the importance of wisdom that recognizes potential in others. His greatest contribution was helping another warrior remember his own strength."
  },

  {
    id: "nala",
    role: "THE MASTER BUILDER",
    name: "NALA",
    group: "KISHKINDHA & ALLIES",
    symbol: "shield",
    symbolLabel: "THE MASTER BUILDER",

    intro:
      "Nala, the gifted Vanara engineer, played a vital role in transforming an impossible crossing into a practical route toward Lanka.",

    story: [
      "When Rama's forces reached the ocean, courage alone could not solve the problem of reaching Lanka. Nala's engineering ability became essential to the construction of the great bridge.",

      "Working with the Vanara forces, Nala helped organize the construction of the bridge that connected the mainland with Lanka.",

      "His contribution demonstrates that great missions depend not only upon warriors but also upon builders, engineers and practical thinkers."
    ],

    qualities: [
      "Engineering skill",
      "Practical intelligence",
      "Leadership",
      "Problem-solving",
      "Cooperation"
    ],

    legacy:
      "Nala demonstrates that the success of great missions depends not only on warriors but also on builders, engineers and practical minds."
  },

  {
    id: "nila",
    role: "THE WARRIOR COMMANDER",
    name: "NILA",
    group: "KISHKINDHA & ALLIES",
    symbol: "swords",
    symbolLabel: "THE WARRIOR COMMANDER",

    intro:
      "Nila was a powerful Vanara commander whose military leadership became important during Rama's campaign against Lanka.",

    story: [
      "Nila participated in organizing Rama's forces and became one of the important commanders during the campaign.",

      "His strength and leadership contributed to the coordinated effort of the Vanara army as it advanced toward Lanka.",

      "His role demonstrates how large military campaigns depend upon organization and cooperation as much as individual heroism."
    ],

    qualities: [
      "Military leadership",
      "Strength",
      "Organization",
      "Courage",
      "Loyalty"
    ],

    legacy:
      "Nila represents the many commanders whose coordinated efforts allowed Rama's alliance to function as a unified force."
  },

  {
    id: "jatayu",
    role: "THE KING OF VULTURES",
    name: "JATAYU",
    group: "KISHKINDHA & ALLIES",
    symbol: "feather",
    symbolLabel: "THE KING OF VULTURES",

    intro:
      "Jatayu, noble king of the vultures, stands as one of the Ramayana's most moving examples of courage, loyalty and sacrifice.",

    story: [
      "Jatayu was an old ally of Dasharatha and recognized Rama's family during their years in the forest. When Ravana abducted Sita, Jatayu attempted to stop him despite the overwhelming danger.",

      "Although he could not prevent Sita from being taken, Jatayu resisted long enough to demonstrate extraordinary courage. His actions gave Rama vital information about what had happened.",

      "His story transforms an elderly ally into one of the epic's clearest symbols of selfless protection."
    ],

    qualities: [
      "Selfless courage",
      "Loyalty",
      "Protective instinct",
      "Sacrifice",
      "Fearlessness"
    ],

    legacy:
      "Jatayu proves that courage is measured not by whether victory is guaranteed, but by whether one chooses to stand for what is right when danger is overwhelming."
  },

  {
    id: "sampati",
    role: "THE ELDER VULTURE",
    name: "SAMPATI",
    group: "KISHKINDHA & ALLIES",
    symbol: "feather",
    symbolLabel: "THE ELDER VULTURE",

    intro:
      "Sampati, elder brother of Jatayu, becomes an unexpected source of knowledge during the Vanara search for Sita.",

    story: [
      "The search party encountered Sampati while struggling to determine where Sita had been taken. Though aged and physically diminished, Sampati possessed knowledge that the younger searchers desperately needed.",

      "He revealed that Sita was being held in Lanka, providing the crucial information that allowed the search to continue toward the ocean.",

      "His story shows that knowledge and experience can remain powerful even when physical strength has faded."
    ],

    qualities: [
      "Experience",
      "Brotherly remembrance",
      "Knowledge",
      "Courage",
      "Service despite age"
    ],

    legacy:
      "Sampati demonstrates that knowledge and experience can become decisive even when physical strength has faded."
  },


  /* =======================================================
     V. LANKA
  ======================================================= */

  {
    id: "ravana",
    role: "THE KING OF LANKA",
    name: "RAVANA",
    group: "LANKA",
    symbol: "om",
    symbolLabel: "THE KING OF GOLDEN LANKA",

    intro:
      "Ravana, formidable ruler of golden Lanka, was renowned for immense power, scholarship, ambition and mastery of many forms of knowledge, yet his pride and defiance ultimately brought destruction upon his kingdom.",

    story: [
      "Ravana ruled Lanka as a powerful and wealthy king. He was a formidable scholar, warrior and devotee who possessed extraordinary abilities and had gained great power through severe discipline.",

      "His decision to abduct Sita transformed personal desire and pride into a conflict that would eventually consume Lanka. Despite repeated warnings from Vibhishana, Mandodari and others, Ravana refused to surrender Sita or acknowledge the danger created by his actions.",

      "The resulting war brought Rama and the Vanara alliance to Lanka. Ravana fought with tremendous power but ultimately fell when Rama defeated him, bringing the conflict to its conclusion."
    ],

    qualities: [
      "Extraordinary scholarship",
      "Immense power",
      "Military ability",
      "Ambition",
      "Fatal pride"
    ],

    legacy:
      "Ravana remains one of the epic's most complex antagonists because his downfall is not presented as a result of weakness. His knowledge and power were immense; his tragedy lies in allowing pride and desire to override wisdom."
  },

  {
    id: "kumbhakarna",
    role: "THE SLEEPING GIANT",
    name: "KUMBHAKARNA",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE COLOSSAL WARRIOR",

    intro:
      "Kumbhakarna, Ravana's colossal brother, was among the most formidable warriors of Lanka, possessing enormous physical strength and a complicated sense of loyalty.",

    story: [
      "Kumbhakarna was known for his immense size, strength and unusual cycles of prolonged sleep. When Ravana faced the advancing army of Rama, Kumbhakarna was awakened and called upon to defend Lanka.",

      "Although he understood that Ravana's actions had created the crisis, Kumbhakarna ultimately chose to fight for his brother and kingdom. He entered the battlefield as a devastating force against Rama's allies.",

      "His defeat became one of the major turning points of the Lanka campaign. His story carries a tragic tension between loyalty to family and awareness of wrongdoing."
    ],

    qualities: [
      "Immense physical strength",
      "Warrior courage",
      "Loyalty to family",
      "Directness",
      "Awareness of moral conflict"
    ],

    legacy:
      "Kumbhakarna represents the tragedy of loyalty without the ability to overcome destructive circumstances. His strength was extraordinary, but even immense power could not reverse the path chosen by Lanka."
  },

  {
    id: "vibhishana",
    role: "THE RIGHTEOUS BROTHER",
    name: "VIBHISHANA",
    group: "LANKA",
    symbol: "feather",
    symbolLabel: "THE VOICE OF DHARMA",

    intro:
      "Vibhishana, younger brother of Ravana, chose dharma over unquestioning loyalty and eventually joined Rama's cause.",

    story: [
      "Vibhishana repeatedly advised Ravana to return Sita and avoid war. He understood that Ravana's actions threatened not only himself but the entire kingdom of Lanka.",

      "When Ravana refused to listen and expelled him, Vibhishana sought refuge with Rama. His knowledge of Lanka and its defenses became valuable during the campaign.",

      "After Ravana's fall, Vibhishana was appointed ruler of Lanka, creating a new political order based on the principle he had defended."
    ],

    qualities: [
      "Moral courage",
      "Wisdom",
      "Loyalty to dharma",
      "Political insight",
      "Willingness to oppose wrongdoing"
    ],

    legacy:
      "Vibhishana demonstrates that true loyalty does not always mean supporting family or authority. Sometimes loyalty to righteousness requires standing against those closest to us."
  },

  {
    id: "indrajit",
    role: "THE INVINCIBLE WARRIOR",
    name: "INDRAJIT",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE PRINCE OF LANKA",

    intro:
      "Indrajit, son of Ravana, was one of Lanka's most formidable warriors and a master of powerful weapons and battlefield strategy.",

    story: [
      "Indrajit earned extraordinary renown through military accomplishments and mastery of divine weapons. His ability to combine strategy with supernatural skill made him one of the greatest threats faced by Rama's forces.",

      "During the war he repeatedly challenged Rama's allies and became particularly associated with the struggle against Lakshmana.",

      "His final confrontation with Lakshmana became one of the decisive battles of the Lanka campaign and marked a major weakening of Ravana's forces."
    ],

    qualities: [
      "Exceptional warrior skill",
      "Strategic intelligence",
      "Mastery of divine weapons",
      "Courage",
      "Determination"
    ],

    legacy:
      "Indrajit represents the formidable military strength available to Lanka. His defeat demonstrated the increasing power and determination of Rama's forces."
  },

  {
    id: "mandodari",
    role: "THE QUEEN OF LANKA",
    name: "MANDODARI",
    group: "LANKA",
    symbol: "crown",
    symbolLabel: "THE QUEEN OF LANKA",

    intro:
      "Mandodari, queen of Lanka and wife of Ravana, is remembered for wisdom, dignity and her repeated attempts to warn Ravana against the consequences of his actions.",

    story: [
      "Mandodari understood the danger created by Ravana's abduction of Sita and repeatedly urged him to return her. Her counsel reflected an awareness of the political and moral consequences that Ravana's pride refused to accept.",

      "Despite the collapse of Lanka around her, Mandodari maintained her dignity. Her position within Ravana's household gave her a close view of the destructive consequences of unchecked power.",

      "Her story stands in contrast to Ravana's refusal to listen, showing the tragedy of wisdom ignored by authority."
    ],

    qualities: [
      "Wisdom",
      "Moral clarity",
      "Royal dignity",
      "Courage to advise Ravana",
      "Emotional resilience"
    ],

    legacy:
      "Mandodari represents wisdom ignored by power. Her warnings become especially tragic because she understands the danger long before Ravana accepts it."
  },

  {
    id: "surpanakha",
    role: "THE PROVOCATEUR",
    name: "SURPANAKHA",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE SPARK OF CONFLICT",

    intro:
      "Surpanakha, sister of Ravana, becomes connected to the chain of events that ultimately expands the conflict from the forest into a war involving Lanka.",

    story: [
      "Surpanakha encountered Rama and Lakshmana during their life in the forest. Her encounter with them ended in humiliation and conflict, after which she appealed to powerful figures within the Rakshasa world.",

      "The events surrounding her became part of the escalating chain that eventually brought Ravana's attention toward Sita.",

      "Her role demonstrates how an encounter that initially appears personal can produce consequences extending far beyond the people directly involved."
    ],

    qualities: [
      "Strong will",
      "Emotional intensity",
      "Persistence",
      "Influence over later events",
      "Defiance"
    ],

    legacy:
      "Surpanakha's role demonstrates how seemingly isolated encounters can trigger consequences that spread far beyond the original participants."
  },

  {
    id: "khara",
    role: "THE RAKSHASA COMMANDER",
    name: "KHARA",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE COMMANDER OF JANASTHANA",

    intro:
      "Khara was a powerful Rakshasa commander who ruled the wilderness of Janasthana and became one of Rama's major early opponents.",

    story: [
      "Khara controlled the Rakshasa forces in the forest region of Janasthana. Following the conflict involving Surpanakha, he mobilized his warriors against Rama.",

      "Rama faced Khara and his forces in a major battle, ultimately defeating them despite their considerable numbers and power.",

      "The battle became one of the early demonstrations of Rama's ability to confront powerful Rakshasa forces even while living as an exile."
    ],

    qualities: [
      "Military authority",
      "Aggression",
      "Strength",
      "Command",
      "Determination"
    ],

    legacy:
      "Khara's defeat establishes Rama's growing reputation as a warrior capable of confronting powerful Rakshasa forces."
  },

  {
    id: "dushana",
    role: "THE FIERCE WARRIOR",
    name: "DUSHANA",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE RAKSHASA WARRIOR",

    intro:
      "Dushana was a fierce Rakshasa warrior and commander who served alongside Khara in Janasthana.",

    story: [
      "Dushana participated in the military response against Rama following the conflict surrounding Surpanakha. He helped lead the Rakshasa forces against the exiled prince.",

      "The battle ended with Rama defeating Dushana and the forces under Khara's command.",

      "His defeat further established Rama's reputation as a powerful warrior long before the eventual war with Lanka."
    ],

    qualities: [
      "Battlefield courage",
      "Military loyalty",
      "Physical strength",
      "Aggression",
      "Command"
    ],

    legacy:
      "Dushana represents the formidable opposition Rama faced even before the war with Lanka began."
  },

  {
    id: "maricha",
    role: "THE MASTER OF ILLUSION",
    name: "MARICHA",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE MASTER OF ILLUSION",

    intro:
      "Maricha was a skilled Rakshasa capable of extraordinary illusions whose transformation into the golden deer became central to Sita's abduction.",

    story: [
      "Maricha had encountered Rama before and understood the danger of opposing him. Nevertheless, Ravana eventually forced him into a plan designed to separate Rama and Lakshmana from Sita.",

      "Maricha transformed himself into the beautiful golden deer that captured Sita's attention. Rama pursued the illusion, creating the opportunity Ravana needed to approach Sita.",

      "His role demonstrates how deception can become a weapon capable of redirecting the course of an entire epic."
    ],

    qualities: [
      "Mastery of illusion",
      "Cunning",
      "Awareness of danger",
      "Fear",
      "Ability to manipulate appearances"
    ],

    legacy:
      "Maricha represents the danger of illusion and deception. His role demonstrates how appearances can become weapons capable of changing the course of an entire epic."
  },

  {
    id: "subahu",
    role: "THE RAKSHASA WARRIOR",
    name: "SUBAHU",
    group: "LANKA",
    symbol: "skull",
    symbolLabel: "THE RAKSHASA WARRIOR",

    intro:
      "Subahu was a fierce Rakshasa who disrupted the sacred rites of sages and became one of Rama's early opponents under the guidance of Vishvamitra.",

    story: [
      "Subahu and Maricha repeatedly disturbed the sacred rituals of Vishvamitra and other sages. Their attacks threatened the completion of the rites and created the need for a capable protector.",

      "Vishvamitra brought Rama and Lakshmana to defend the ceremony. Rama confronted Subahu and defeated him, while Maricha was driven away.",

      "The encounter became one of Rama's earliest demonstrations of warrior ability and marked an important step in his development."
    ],

    qualities: [
      "Fierce combat ability",
      "Aggression",
      "Loyalty to Rakshasa forces",
      "Fearlessness",
      "Military strength"
    ],

    legacy:
      "Subahu's defeat marks one of Rama's earliest demonstrations of warrior ability and establishes the prince as a protector of sacred order."
  }
];


/* =========================================================
   CHARACTER ICON
========================================================= */

function CharacterSymbol({ type }) {

  if (type === "bow") {
    return (
      <ArrowRight
        size={46}
        strokeWidth={1.25}
      />
    );
  }

  if (type === "flower") {
    return (
      <Flower2
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  if (type === "gadha") {
    return (
      <Hammer
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  if (type === "om") {
    return (
      <span className="ramayana-character-detail__om">
        ॐ
      </span>
    );
  }

  if (type === "skull") {
    return (
      <Skull
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  if (type === "crown") {
    return (
      <Crown
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  if (type === "shield") {
    return (
      <Shield
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  if (type === "swords") {
    return (
      <Swords
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  if (type === "feather") {
    return (
      <Sparkles
        size={46}
        strokeWidth={1.15}
      />
    );
  }

  return (
    <ScrollText
      size={46}
      strokeWidth={1.15}
    />
  );
}


/* =========================================================
   COMPONENT
========================================================= */

function RamayanaCharacterDetail() {

  const { characterId } = useParams();

  const currentIndex = characters.findIndex(
    (character) =>
      character.id === characterId
  );

  const character =
    currentIndex !== -1
      ? characters[currentIndex]
      : characters[0];

  const previousCharacter =
    currentIndex > 0
      ? characters[currentIndex - 1]
      : characters[characters.length - 1];

  const nextCharacter =
    currentIndex !== -1 &&
    currentIndex < characters.length - 1
      ? characters[currentIndex + 1]
      : characters[0];


  return (

    <main
      className={`ramayana-character-detail-page ramayana-character-detail-page--${character.id}`}
    >

      {/* =====================================================
          ATMOSPHERE
      ===================================================== */}

      <div className="ramayana-character-detail__ambient" />

      <div className="ramayana-character-detail__sun" />

      <div className="ramayana-character-detail__geometry">
        <span />
        <span />
        <span />
      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="ramayana-character-detail-nav">

        <Link
          to="/journey/ramayana/characters"
          className="ramayana-character-detail-nav__back"
        >
          <ArrowLeft size={17} />

          <span>
            BACK TO CHARACTERS
          </span>
        </Link>


        <Link
          to="/journey/ramayana"
          className="ramayana-character-detail-nav__brand"
        >
          ANCESTRA
        </Link>


        <span className="ramayana-character-detail-nav__archive">
          RAMAYANA ARCHIVE
        </span>

      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="ramayana-character-detail-hero">

        <div className="ramayana-character-detail-hero__content">

          <motion.div
            className="ramayana-character-detail__eyebrow"
            initial={{
              opacity: 0,
              y: 18
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8
            }}
          >
            {character.symbolLabel}
          </motion.div>


          <motion.div
            className="ramayana-character-detail__group"
            initial={{
              opacity: 0,
              y: 15
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.8,
              delay: 0.1
            }}
          >
            {character.group}
          </motion.div>


          <motion.h1
            key={character.id}
            initial={{
              opacity: 0,
              y: 35,
              filter: "blur(8px)"
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)"
            }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {character.name}
          </motion.h1>


          <motion.p
            className="ramayana-character-detail__intro"
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.9,
              delay: 0.25
            }}
          >
            {character.intro}
          </motion.p>

        </div>


        {/* ===================================================
            SYMBOL
        =================================================== */}

        <motion.div
          className="ramayana-character-detail__symbol-area"
          initial={{
            opacity: 0,
            scale: 0.82
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            duration: 1,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1]
          }}
        >

          <div className="ramayana-character-detail__symbol-orbit orbit-one" />

          <div className="ramayana-character-detail__symbol-orbit orbit-two" />

          <div className="ramayana-character-detail__symbol">

            <CharacterSymbol
              type={character.symbol}
            />

          </div>

          <span className="ramayana-character-detail__symbol-caption">
            {character.symbolLabel}
          </span>

        </motion.div>

      </section>


      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="ramayana-character-detail-story">

        <div className="ramayana-character-detail-section-label">

          <span>
            I
          </span>

          <small>
            THE JOURNEY
          </small>

        </div>


        <div className="ramayana-character-detail-story__heading">

          <p>
            THE STORY
          </p>

          <h2>
            A Life Within
            <em> The Epic</em>
          </h2>

        </div>


        <div className="ramayana-character-detail-story__text">

          {character.story.map(
            (paragraph, index) => (

              <motion.p
                key={`${character.id}-story-${index}`}
                initial={{
                  opacity: 0,
                  y: 25
                }}
                whileInView={{
                  opacity: 1,
                  y: 0
                }}
                viewport={{
                  once: true,
                  amount: 0.2
                }}
                transition={{
                  duration: 0.75,
                  delay: index * 0.08
                }}
              >
                {paragraph}
              </motion.p>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          ESSENCE
      ===================================================== */}

      <section className="ramayana-character-detail-essence">

        <div className="ramayana-character-detail-section-label">

          <span>
            II
          </span>

          <small>
            ESSENCE
          </small>

        </div>


        <div className="ramayana-character-detail-essence__heading">

          <p>
            ESSENCE
          </p>

          <h2>
            Defining
            <em> Qualities</em>
          </h2>

        </div>


        <div className="ramayana-character-detail-qualities">

          {character.qualities.map(
            (quality, index) => (

              <motion.div
                className="ramayana-character-detail-quality"
                key={`${character.id}-quality-${index}`}
                initial={{
                  opacity: 0,
                  x: -20
                }}
                whileInView={{
                  opacity: 1,
                  x: 0
                }}
                viewport={{
                  once: true,
                  amount: 0.2
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.07
                }}
              >

                <span className="ramayana-character-detail-quality__dot">
                  ✦
                </span>

                <span>
                  {quality}
                </span>

              </motion.div>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          LEGACY
      ===================================================== */}

      <section className="ramayana-character-detail-legacy">

        <div className="ramayana-character-detail-section-label">

          <span>
            III
          </span>

          <small>
            BEYOND THE STORY
          </small>

        </div>


        <div className="ramayana-character-detail-legacy__content">

          <div className="ramayana-character-detail-legacy__icon">

            <ScrollText
              size={31}
              strokeWidth={1.15}
            />

          </div>


          <div>

            <p>
              BEYOND THE STORY
            </p>

            <h2>
              Legacy
            </h2>


            <div className="ramayana-character-detail-legacy__ornament">

              <span />

              <i>
                ✦
              </i>

              <span />

            </div>


            <p className="ramayana-character-detail-legacy__text">
              {character.legacy}
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          CHARACTER NAVIGATION
      ===================================================== */}

      <section className="ramayana-character-detail-navigation">

        <Link
          to={`/journey/ramayana/characters/${previousCharacter.id}`}
          className="ramayana-character-detail-navigation__item previous"
        >

          <span className="ramayana-character-detail-navigation__label">
            PREVIOUS
          </span>

          <span className="ramayana-character-detail-navigation__name">

            <ArrowLeft size={18} />

            {previousCharacter.name}

          </span>

        </Link>


        <Link
          to="/journey/ramayana/characters"
          className="ramayana-character-detail-navigation__all"
        >

          <span className="ramayana-character-detail-navigation__all-dot" />

          <span>
            ALL CHARACTERS
          </span>

        </Link>


        <Link
          to={`/journey/ramayana/characters/${nextCharacter.id}`}
          className="ramayana-character-detail-navigation__item next"
        >

          <span className="ramayana-character-detail-navigation__label">
            NEXT
          </span>

          <span className="ramayana-character-detail-navigation__name">

            {nextCharacter.name}

            <ArrowRight size={18} />

          </span>

        </Link>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="ramayana-character-detail-footer">

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

export default RamayanaCharacterDetail;