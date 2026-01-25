# React Video Player

Production-grade React video player with YouTube-style features.

## Monorepo Structure

```
react-video-player/
├── packages/
│   └── react-video-player/    # NPM package
├── examples/
│   └── nextjs-demo/           # Demo application
└── package.json               # Root config
```

## Development

```bash
# Install dependencies
npm install

# Build package
npm run build

# Run demo (uses local package)
npm run dev

# Watch package for changes
npm run dev:package
```

## Publishing

```bash
# Build and publish to NPM
npm run publish:package
```

## Package

The package is located in `packages/react-video-player/`.

See [package README](packages/react-video-player/README.md) for usage instructions.

## License

MIT
