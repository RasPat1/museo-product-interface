import { runScrapers } from './scrapers/index';

const args = process.argv.slice(2);

const museumArg = args.find(a => a.startsWith('--museum='));
const museums = museumArg ? [museumArg.split('=')[1]] : undefined;
const dryRun = args.includes('--dry-run');

runScrapers({ museums, dryRun }).then(({ errors }) => {
  if (errors.length > 0) {
    process.exit(1);
  }
});
