import db from './database';

// Insert a new embedding
const insertEmbedding = (text, embedding, callback) => {
    db.run(
        `INSERT INTO embeddings (text, embedding) VALUES (?, ?)`,
        [text, JSON.stringify(embedding)],
        function (err) {
            if (err) {
                console.error('Error inserting embedding:', err);
                callback(err);
            } else {
                callback(null, this.lastID);
            }
        }
    );
};

// Retrieve an embedding by ID
const getEmbeddingById = (id, callback) => {
    db.get(
        `SELECT * FROM embeddings WHERE id = ?`,
        [id],
        (err, row) => {
            if (err) {
                console.error('Error retrieving embedding:', err);
                callback(err);
            } else {
                callback(null, row);
            }
        }
    );
};

// Retrieve all embeddings
const getAllEmbeddings = (callback) => {
    db.all(
        `SELECT * FROM embeddings`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error retrieving embeddings:', err);
                callback(err);
            } else {
                callback(null, rows);
            }
        }
    );
};

// Delete an embedding by ID
const deleteEmbeddingById = (id, callback) => {
    db.run(
        `DELETE FROM embeddings WHERE id = ?`,
        [id],
        function (err) {
            if (err) {
                console.error('Error deleting embedding:', err);
                callback(err);
            } else {
                callback(null, this.changes);
            }
        }
    );
};

export {
    insertEmbedding,
    getEmbeddingById,
    getAllEmbeddings,
    deleteEmbeddingById,
};