import db from './database';
import similarity from 'compute-cosine-similarity';

// Retrieve all embeddings and find the most similar
const searchEmbeddings = (queryEmbedding, callback) => {
    db.all(
        `SELECT id, text, embedding FROM embeddings`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error retrieving embeddings:', err);
                callback(err);
            } else {
                const results = rows.map(row => {
                    const storedEmbedding = JSON.parse(row.embedding);
                    return { id: row.id, text: row.text, similarity: similarity(queryEmbedding, storedEmbedding) };
                })
                    // Filter results based on a similarity threshold (e.g., 0.8)
                    .filter(result => result.similarity >= 0.8);

                // Sort results by similarity in descending order
                results.sort((a, b) => b.similarity - a.similarity);
                callback(null, results);
            }
        }
    );
};

export { searchEmbeddings };