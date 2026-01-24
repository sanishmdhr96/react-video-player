# Installation

npm install @videoplayer/react

# Usage

import VideoPlayer from '@videoplayer/react';
import '@videoplayer/react/dist/style.css'; // Import CSS

# Customization

## Method 1: CSS Variables

.my-player {
--player-primary-color: #ff0000;
}

## Method 2: Custom CSS Classes

.my-player .progress {
background: linear-gradient(to right, #ff0000, #00ff00);
}

## Method 3: className prop

<VideoPlayer className="my-custom-player" />
