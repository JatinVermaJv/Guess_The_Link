const fs = require('fs').promises;
const path = require('path');

class DataManager {
    constructor() {
        this.dataPath = path.join(__dirname, 'imageSets.json');
        this.imageSets = [];
        this.usedSets = new Set();
    }

    // Initialize the data manager
    async initialize() {
        try {
            // Create data file if it doesn't exist
            try {
                await fs.access(this.dataPath);
            } catch {
                await this.createInitialData();
            }

            // Load image sets
            const data = await fs.readFile(this.dataPath, 'utf8');
            this.imageSets = JSON.parse(data);
        } catch (error) {
            console.error('Error initializing DataManager:', error);
            throw error;
        }
    }

    // Create initial data file with sample image sets
    async createInitialData() {
        const initialData = [
            {
                id: 1,
                images: [
                    'https://example.com/set1/image1.jpg',
                    'https://example.com/set1/image2.jpg',
                    'https://example.com/set1/image3.jpg'
                ],
                correctAnswer: 'example.com',
                category: 'technology'
            },
            {
                id: 2,
                images: [
                    'https://example.com/set2/image1.jpg',
                    'https://example.com/set2/image2.jpg',
                    'https://example.com/set2/image3.jpg'
                ],
                correctAnswer: 'example.com',
                category: 'entertainment'
            }
        ];

        await fs.writeFile(this.dataPath, JSON.stringify(initialData, null, 2));
        this.imageSets = initialData;
    }

    // Get a random image set that hasn't been used
    getRandomImageSet() {
        // Reset used sets if all sets have been used
        if (this.usedSets.size >= this.imageSets.length) {
            this.usedSets.clear();
        }

        // Filter out used sets
        const availableSets = this.imageSets.filter(set => !this.usedSets.has(set.id));

        // Get a random set from available sets
        const randomIndex = Math.floor(Math.random() * availableSets.length);
        const selectedSet = availableSets[randomIndex];

        // Mark the set as used
        this.usedSets.add(selectedSet.id);

        return selectedSet;
    }

    // Add a new image set
    async addImageSet(imageSet) {
        // Validate image set
        this.validateImageSet(imageSet);

        // Generate new ID
        const newId = Math.max(...this.imageSets.map(set => set.id), 0) + 1;
        const newSet = { ...imageSet, id: newId };

        // Add to image sets
        this.imageSets.push(newSet);

        // Save to file
        await this.saveToFile();

        return newSet;
    }

    // Validate image set structure
    validateImageSet(imageSet) {
        if (!imageSet.images || !Array.isArray(imageSet.images) || imageSet.images.length !== 3) {
            throw new Error('Image set must contain exactly 3 images');
        }
        if (!imageSet.correctAnswer || typeof imageSet.correctAnswer !== 'string') {
            throw new Error('Image set must have a correct answer');
        }
        if (!imageSet.category || typeof imageSet.category !== 'string') {
            throw new Error('Image set must have a category');
        }
    }

    // Save current image sets to file
    async saveToFile() {
        try {
            await fs.writeFile(this.dataPath, JSON.stringify(this.imageSets, null, 2));
        } catch (error) {
            console.error('Error saving image sets:', error);
            throw error;
        }
    }

    // Get all image sets
    getAllImageSets() {
        return [...this.imageSets];
    }

    // Get image sets by category
    getImageSetsByCategory(category) {
        return this.imageSets.filter(set => set.category === category);
    }

    // Get image set by ID
    getImageSetById(id) {
        return this.imageSets.find(set => set.id === id);
    }

    // Delete image set by ID
    async deleteImageSet(id) {
        const index = this.imageSets.findIndex(set => set.id === id);
        if (index === -1) {
            throw new Error('Image set not found');
        }

        this.imageSets.splice(index, 1);
        await this.saveToFile();
    }

    // Update image set
    async updateImageSet(id, updates) {
        const index = this.imageSets.findIndex(set => set.id === id);
        if (index === -1) {
            throw new Error('Image set not found');
        }

        // Validate updates if they contain images or correctAnswer
        if (updates.images || updates.correctAnswer) {
            this.validateImageSet({ ...this.imageSets[index], ...updates });
        }

        this.imageSets[index] = { ...this.imageSets[index], ...updates };
        await this.saveToFile();

        return this.imageSets[index];
    }
}

module.exports = DataManager; 