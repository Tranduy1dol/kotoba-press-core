FROM mongo:7

COPY seed.js /seed/seed.js

CMD ["mongosh", "mongodb://mongo:27017/learning_japanese", "/seed/seed.js"]
