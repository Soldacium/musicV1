# Environment Setup

This project uses environment variables to manage different hosting configurations for development and production.

## Development Setup

The development environment is already configured to use a proxy to avoid CORS issues:

- **File**: `src/environments/environment.ts`
- **Music Host**: `/music` (uses proxy configuration)
- **Status**: Ready to use

## Production Setup

For production deployment, you need to create your own `environment.prod.ts` file:

1. Copy the template file:

   ```bash
   cp src/environments/environment.prod.template.ts src/environments/environment.prod.ts
   ```

2. Edit `src/environments/environment.prod.ts` and replace the URL with your actual production music hosting URL.

3. Example:
   ```typescript
   export const environment = {
     production: true,
     musicHost: 'https://pub-076afcd4cf1f4835b1e30a6be0bb265f.r2.dev/albums',
   };
   ```

## URL Structure

Your music files should be organized in the Cloudflare R2 bucket as follows:

```
albums/
├── circus/
│   ├── 01.mp3
│   ├── 02.mp3
│   └── ...
└── where_are_my_friends/
    ├── 01.mp3
    ├── 02.mp3
    └── ...
```

## CORS Configuration

### Development

- Uses Angular proxy configuration (`proxy.conf.json`)
- Automatically handles CORS issues during development
- No additional setup required

### Production

- Your Cloudflare R2 bucket needs proper CORS headers
- Add the following CORS configuration to your Cloudflare R2 bucket:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## Build Commands

- **Development**: `ng serve` (uses development environment)
- **Production**: `ng build --prod` (uses production environment)

## Security Notes

- The `environment.prod.ts` file is gitignored to prevent sensitive URLs from being committed
- Always use the template file as a reference
- Never commit actual production URLs to version control
