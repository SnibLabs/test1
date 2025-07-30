// Utility functions

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}