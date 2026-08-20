# LINTU vs LINTU - Bird species comparison tool

=== WORK IN PROGRESS === 

This project is designed as a helper tool for birders trying to tell apart similar looking species. Compare pictures, sizes, appearance details, behavior, habitats, calls, and more. Bird data compiled using the [BirdNET+ Taxonomy](https://github.com/birdnet-team/birdnet-taxonomy) pipeline.

Inspired by the marsh sandpiper, the green sandpiper, the wood sandpiper, and the common greenshank, and my inability to tell them apart.

## Status

The current version is a base MVP with a basic search and species data views using mock data.

## Birdnet Taxonomy setup

Clone and set up [BirdNET+ Taxonomy](https://github.com/birdnet-team/birdnet-taxonomy) in the project's root folder. Follow the setup described in its README.

In case of issues with .venv setup, try the following instead:

```bash
git clone https://github.com/birdnet-team/birdnet-taxonomy.git
cd birdnet-taxonomy
python3 -m venv .venv
source .venv/scripts/activate
pip install -r requirements.txt
```

### Collectors

Run the collectors.

```bash
python -m collectors.avilist
python -m collectors.inat --group Aves --limit 100   // Can take a long time when run in full
python -m collectors.ebird --skip-names --limit 100  // Ehkä turha? Kielet saa wikidatasta
python -m collectors.wikidata --limit 100
python -m collectors.wikipedia --limit 100
python -m collectors.macaulay --group Aves --limit 100
```

## Setup database

Return to the project's root folder. Create an .env file and edit its contents.

```bash
cp .env.example .env
```

Create the database.

```bash
npm install @prisma/client pg ; npm install -D prisma
npx prisma generate
```
If needed, run migrations with:

```bash
npx prisma migrate dev --name <migration_name>
```

## To be added

- Database of extensive bird data built using the [BirdNET+ Taxonomy](https://github.com/birdnet-team/birdnet-taxonomy) pipeline.
- Toggle information on display
- Extended image comparison
- Graphic size comparison widget
- Range information
- Filter species by location
- Toggle for species common name language
- Toggle for app language
- Habitat information
- Behavior information
- Breeding information
- Dimorphism information
- Call information
- Suggest similar species
- Conservation status information
- Unit testing

## Next.js README copypaste

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

