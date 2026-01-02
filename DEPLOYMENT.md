# Cloud Run Deployment Guide

This application is configured to deploy to Google Cloud Run using Cloud Buildpacks for Node.js.

## Prerequisites

1. [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
2. A Google Cloud Project with billing enabled
3. Enable the Cloud Run API and Cloud Build API

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

## Deployment Steps

### 1. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Deploy to Cloud Run

Deploy directly from source code using buildpacks:

```bash
gcloud run deploy cfdgts \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed
```

This command will:
- Use Google Cloud Buildpacks to automatically detect this is a Node.js application
- Run the `gcp-build` script to build the application
- Create a container image
- Deploy the container to Cloud Run
- Run the `start` script to serve the application

### 3. Custom Configuration Options

You can customize the deployment with additional flags:

```bash
gcloud run deploy cfdgts \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300
```

## How It Works

### package.json Scripts

The deployment uses two key scripts defined in `package.json`:

1. **`gcp-build`**: Executed during the build phase by Cloud Buildpacks
   ```json
   "gcp-build": "npm run build && npm run build:editor"
   ```
   This builds both the library and the production editor.

2. **`start`**: Executed when the container starts on Cloud Run
   ```json
   "start": "serve dist-editor -l ${PORT:-8080}"
   ```
   This serves the built editor application using the `serve` package. The `PORT` environment variable is automatically provided by Cloud Run.

### Build Process

1. Cloud Buildpacks detects this is a Node.js project from `package.json`
2. Installs dependencies with `npm install`
3. Runs `npm run gcp-build` which:
   - Builds the parser (`build:parser`)
   - Compiles TypeScript (`build:ts`)
   - Creates browser bundle (`build:browser`)
   - Copies files to public (`copy:public`)
   - Builds the Vite production bundle (`build:editor`)
4. Creates a container with the built application
5. Starts the container with `npm start`

### What Gets Deployed

The `.gcloudignore` file ensures only necessary files are uploaded:
- `node_modules/` (will be installed during build)
- `dist-editor/` (will be built during `gcp-build`)
- `package.json` and `package-lock.json`
- Build scripts needed for `gcp-build`

Source code and development files are excluded to reduce upload time and image size.

## Testing Locally

You can test the production build locally:

```bash
# Build the application
npm run gcp-build

# Start the server
PORT=8080 npm start
```

Then visit http://localhost:8080 in your browser.

## Monitoring and Logs

After deployment, you can:

1. View logs:
   ```bash
   gcloud run services logs read cfdgts --region us-central1
   ```

2. Get service details:
   ```bash
   gcloud run services describe cfdgts --region us-central1
   ```

3. View in Cloud Console:
   - Navigate to Cloud Run in the Google Cloud Console
   - Select your service to view metrics, logs, and configuration

## Environment Variables

If you need to add environment variables:

```bash
gcloud run deploy cfdgts \
  --source . \
  --region us-central1 \
  --set-env-vars "VAR_NAME=value"
```

## Troubleshooting

### Build Fails

- Check build logs: `gcloud builds list` and `gcloud builds log <BUILD_ID>`
- Ensure all dependencies are in `package.json`
- Test the build locally: `npm run gcp-build`

### Application Doesn't Start

- Check logs: `gcloud run services logs read cfdgts`
- Verify the `start` script works locally
- Ensure the `PORT` environment variable is properly used

### 404 Errors

- Verify `dist-editor/` was created during build
- Check that `serve` is serving the correct directory
- Test locally with `npm start`

## References

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Buildpacks for Node.js](https://cloud.google.com/docs/buildpacks/nodejs)
- [serve Package Documentation](https://github.com/vercel/serve)
