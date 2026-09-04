# 3D Lab Manager

3D Lab Manager is a web application built for the Senior Design Engineering Lab at the University of Texas at Arlington. The app helps students and staff browse lab equipment, locate items on an interactive 3D lab map, manage equipment checkouts using QR codes, and report broken or missing items.

## Features

- **Inventory Management**: Search, filter, and view lab equipment by category, status, and location.
- **Interactive 3D Lab Map**: Explore the lab environment in 3D and identify where equipment is located.
- **QR Code Checkout System**: Check out and return equipment through QR code scanning.
- **Issue Reporting**: Report broken, missing, or damaged equipment directly through the app.
- **Admin Dashboard**: Manage equipment, users, labs, checkout records, and reported issues.
- **Responsive Design**: Supports both desktop and mobile users.

## Tech Stack

### Frontend

- React 19
- Vite
- Material UI
- Tailwind CSS v4
- Vanilla CSS

### 3D Rendering

- Three.js
- `@react-three/fiber`
- `@react-three/drei`

### Backend and Database

- Supabase Authentication
- Supabase PostgreSQL Database
- Supabase Storage
- Supabase CLI

## Prerequisites

Before running the project, make sure you have the following installed or available:

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- Supabase account
- Supabase CLI
- Git

Install the Supabase CLI if needed:

```bash
npm install -g supabase
```

You can also use `npx supabase` instead of installing the CLI globally.

## Project Structure

```txt
3D-Lab-Manager/
├── frontend/          # React frontend application
├── backend/           # Supabase configuration and migrations
├── README.md
└── LICENSE
```

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<user>/3D-Lab-Manager.git
cd 3D-Lab-Manager
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Create Environment Variables

Create a `.env` file inside the `frontend` directory:

```bash
touch .env
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under:

```txt
Project Settings → API
```

### 4. Run the Development Server

From the `frontend` directory, run:

```bash
npm run dev
```

The local development site should be available at:

```txt
http://localhost:5173
```

## Supabase Backend Setup

The backend is managed through Supabase. Supabase handles authentication, the PostgreSQL database, and file storage.

### 1. Log In to Supabase

```bash
supabase login
```

Or, if using `npx`:

```bash
npx supabase login
```

### 2. Link the Local Backend to a Supabase Project

From the `backend` directory, link the project:

```bash
cd backend
supabase link --project-ref your-project-ref
```

Or with `npx`:

```bash
npx supabase link --project-ref your-project-ref
```

The project reference can be found in the Supabase dashboard under:

```txt
Project Settings → General → Reference ID
```

### 3. Pull the Latest Remote Schema

If you are connecting to an existing Supabase project, pull the current remote schema:

```bash
supabase db pull
```

Or:

```bash
npx supabase db pull
```

This creates a local migration file that reflects the current remote database schema.

### 4. Push Migrations to a New Project

If you are setting up a new Supabase project from the local migrations, run:

```bash
supabase db push
```

Or:

```bash
npx supabase db push
```

## Required Supabase Tables

To run the app fully, the Supabase database should include the following tables:

- `equipment`: Stores equipment details such as name, category, status, location, QR code, and image/model references.
- `labs`: Stores lab room or environment data used by the 3D map.
- `profiles`: Stores user profile data and roles such as admin, staff, or student.
- `checkout_log`: Tracks equipment checkout and return history.
- `issues`: Stores reports for broken, missing, or damaged equipment.

## Required Supabase Storage Buckets

Create the following storage buckets in the Supabase dashboard:

- `equipment-thumbnails`: Stores equipment image thumbnails.
- `lab-models`: Stores 3D GLB or GLTF models for lab environments.
- `equipment-models`: Stores 3D models for individual equipment items.

Storage buckets can be created from:

```txt
Supabase Dashboard → Storage → New bucket
```

## Supabase Authentication Configuration

Supabase authentication must be configured correctly for sign-up, email confirmation, and password reset links to work.

In the Supabase dashboard, go to:

```txt
Authentication → URL Configuration
```

Recommended settings:

### Site URL

For local development:

```txt
http://localhost:5173
```

For the deployed app:

```txt
https://3dlab.e16a.com
```

### Redirect URLs

Add both local and deployed URLs:

```txt
http://localhost:5173/**
https://3dlab.e16a.com/**
```

If email confirmation or password reset links redirect to `localhost` while using the deployed site, update the Supabase Site URL and Redirect URLs to include the deployed frontend URL.


## Dokploy Deployment

The project includes a frontend `Dockerfile` that is primarily used for deployment through Dokploy. Dokploy builds the frontend container from the Dockerfile and serves the production-ready React/Vite application.

When deploying through Dokploy, make sure the production environment variables are configured in the Dokploy project settings:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The deployed frontend URL must also be added to the Supabase authentication URL configuration so email confirmation and password reset links redirect correctly.

The Dockerfile can also be tested locally if needed:

```bash
cd frontend
docker build -t 3d-lab-manager-frontend .
docker run -p 80:80 3d-lab-manager-frontend
```

## Deployment

The deployed application is available at:

```txt
https://3dlab.e16a.com
```

When deploying the frontend, make sure the production environment includes:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Also make sure the deployed frontend URL is added to the Supabase authentication redirect settings.

## Troubleshooting

### Email confirmation links redirect to localhost

Check the Supabase authentication URL settings:

```txt
Authentication → URL Configuration
```

Make sure the deployed frontend URL is added to both the Site URL and Redirect URLs.


### Environment variables are not loading

Make sure the `.env` file is inside the `frontend` directory and that the variable names start with `VITE_`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Restart the development server after updating `.env`.

### Storage images or models are not loading

Check that the required Supabase storage buckets exist and that the file paths stored in the database match the files uploaded to Supabase Storage.

### Browser Loading Issues
If the app gets stuck loading, shows a blank screen, or certain parts of the page do not load correctly, try clearing the browser cache or opening the app in a different browser. 

## License

This project is licensed under the [MIT License](LICENSE).