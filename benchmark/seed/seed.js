// benchmark/seed/seed.js
// MongoDB seed script for kotoba-press-core benchmarks.
// Run with: mongosh mongodb://localhost:27017/learning_japanese seed.js

const db = db.getSiblingDB("learning_japanese");

// ---------------------------------------------------------------------------
// Words collection
// ---------------------------------------------------------------------------
db.words.drop();

db.words.insertMany([
  {
    _id: ObjectId("000000000000000000000001"),
    kanji: "食べる",
    hiragana: "たべる",
    romaji: "taberu",
    meaning: "to eat",
    jlpt_level: "N5",
    examples: [
      { sentence: "朝ごはんを食べる。", translation: "I eat breakfast." },
      { sentence: "寿司を食べたい。", translation: "I want to eat sushi." },
    ],
  },
  {
    _id: ObjectId("000000000000000000000002"),
    kanji: "勉強",
    hiragana: "べんきょう",
    romaji: "benkyou",
    meaning: "study",
    jlpt_level: "N5",
    examples: [
      { sentence: "毎日日本語を勉強しています。", translation: "I study Japanese every day." },
      { sentence: "図書館で勉強する。", translation: "I study at the library." },
    ],
  },
  {
    _id: ObjectId("000000000000000000000003"),
    kanji: "経験",
    hiragana: "けいけん",
    romaji: "keiken",
    meaning: "experience",
    jlpt_level: "N3",
    examples: [
      { sentence: "いい経験になりました。", translation: "It was a good experience." },
      { sentence: "経験が必要です。", translation: "Experience is required." },
    ],
  },
  {
    _id: ObjectId("000000000000000000000004"),
    kanji: "挑戦",
    hiragana: "ちょうせん",
    romaji: "chousen",
    meaning: "challenge",
    jlpt_level: "N2",
    examples: [
      { sentence: "新しいことに挑戦する。", translation: "I challenge myself with something new." },
      { sentence: "挑戦を受けて立つ。", translation: "I accept the challenge." },
    ],
  },
  {
    _id: ObjectId("000000000000000000000005"),
    kanji: "曖昧",
    hiragana: "あいまい",
    romaji: "aimai",
    meaning: "ambiguous; vague",
    jlpt_level: "N1",
    examples: [
      { sentence: "曖昧な返事をする。", translation: "Give a vague answer." },
      { sentence: "曖昧な表現は避けてください。", translation: "Please avoid ambiguous expressions." },
    ],
  },
]);

print("✅  Inserted 5 words into 'words' collection.");

// ---------------------------------------------------------------------------
// Grammars collection
// ---------------------------------------------------------------------------
db.grammars.drop();

db.grammars.insertMany([
  {
    _id: ObjectId("000000000000000000000011"),
    title: "〜てもいい",
    structure: "Verb て-form + もいい",
    meaning: "It's okay to …; may I …",
    jlpt_level: "N5",
    examples: [
      { sentence: "ここに座ってもいいですか。", translation: "May I sit here?" },
      { sentence: "写真を撮ってもいいですよ。", translation: "It's okay to take photos." },
    ],
  },
  {
    _id: ObjectId("000000000000000000000012"),
    title: "〜ば〜ほど",
    structure: "Verb ば-form + Verb dictionary form + ほど",
    meaning: "The more … the more …",
    jlpt_level: "N3",
    examples: [
      { sentence: "練習すればするほど上手になる。", translation: "The more you practice, the better you get." },
      { sentence: "読めば読むほど面白い。", translation: "The more you read, the more interesting it is." },
    ],
  },
  {
    _id: ObjectId("000000000000000000000013"),
    title: "〜わけがない",
    structure: "Verb plain form + わけがない",
    meaning: "There's no way that …",
    jlpt_level: "N2",
    examples: [
      { sentence: "彼がそんなことを言うわけがない。", translation: "There's no way he said such a thing." },
      { sentence: "一日で終わるわけがない。", translation: "There's no way it will be done in one day." },
    ],
  },
]);

print("✅  Inserted 3 grammars into 'grammars' collection.");

// ---------------------------------------------------------------------------
// Users collection (benchmark user)
// ---------------------------------------------------------------------------
db.users.drop();

db.users.insertOne({
  _id: ObjectId("000000000000000000000099"),
  google_id: "bench-google-id",
  email: "bench@test.com",
  name: "Benchmark User",
  role: "user",
  created_at: new Date(),
  updated_at: new Date(),
});

print("✅  Inserted benchmark user into 'users' collection.");
print("🎉  Seed complete.");
