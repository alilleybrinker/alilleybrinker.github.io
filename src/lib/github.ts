import projectsConfig from '../../content/projects/projects.json';
import snapshot from '../data/github-repos.json';

const GITHUB_USER = 'alilleybrinker';
const REPOS_ENDPOINT = `https://api.github.com/users/${GITHUB_USER}/repos?type=owner&per_page=100`;
const FRESH_DAYS = 14;

export interface GitHubRepo {
  name: string;
  html_url: string;
  homepage: string | null;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  topics?: string[] | null;
}

export interface ActiveProject {
  name: string;
  url: string;
  // Host shown on the card when the project links somewhere other than GitHub.
  site?: string;
  description: string;
  language?: string;
  stars: number;
  pushedAt: Date;
  fresh: boolean;
  topics: string[];
}

export interface EarlierProject {
  name: string;
  url: string;
  description: string;
  note: string;
}

let reposInFlight: Promise<{ repos: GitHubRepo[]; asOf: Date }> | undefined;

async function fetchRepos(): Promise<{ repos: GitHubRepo[]; asOf: Date }> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const response = await fetch(REPOS_ENDPOINT, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    return { repos: await response.json() as GitHubRepo[], asOf: new Date() };
  } catch (error) {
    // Fall back to the committed snapshot so a GitHub outage or rate limit
    // never blocks a deploy; the page just shows slightly older data.
    console.warn(`[projects] Using GitHub snapshot from ${snapshot.fetchedAt}: ${error}`);
    return { repos: snapshot.repos as GitHubRepo[], asOf: new Date(snapshot.fetchedAt) };
  }
}

function getRepos() {
  reposInFlight ??= fetchRepos();
  return reposInFlight;
}

const isGitHubUrl = (url: string) => new URL(url).host === 'github.com';
const displayHost = (url: string) => new URL(url).host.replace(/^www\./, '');

export async function getProjects() {
  const { repos, asOf } = await getRepos();
  const hidden = new Set(projectsConfig.hidden);
  // Pinned projects stay on the workbench even when they haven't been pushed lately.
  const pinned = new Set(projectsConfig.pinned);
  const links: Record<string, string> = projectsConfig.links;
  const activeSince = new Date(asOf);
  activeSince.setUTCMonth(activeSince.getUTCMonth() - projectsConfig.activeMonths);
  const earlierNames = new Set(projectsConfig.earlier.map((project) => project.name));

  const active: ActiveProject[] = repos
    .filter((repo) => !repo.fork && !repo.archived && repo.description?.trim())
    .filter((repo) => !hidden.has(repo.name) && !earlierNames.has(repo.name))
    .filter((repo) => pinned.has(repo.name) || new Date(repo.pushed_at) >= activeSince)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name))
    .map((repo) => {
      const url = links[repo.name] ?? repo.html_url;
      const pushedAt = new Date(repo.pushed_at);
      return {
        name: repo.name,
        url,
        site: isGitHubUrl(url) ? undefined : displayHost(url),
        description: repo.description!.trim(),
        language: repo.language ?? undefined,
        stars: repo.stargazers_count,
        pushedAt,
        fresh: asOf.getTime() - pushedAt.getTime() <= FRESH_DAYS * 86_400_000,
        topics: (repo.topics ?? []).filter((topic) => topic !== 'rust').slice(0, 1),
      };
    });

  const byName = new Map(repos.map((repo) => [repo.name, repo]));
  const earlier: EarlierProject[] = projectsConfig.earlier.map((project) => {
    const repo = byName.get(project.name);
    const url = 'url' in project && project.url ? project.url : repo?.html_url;
    if (!url) throw new Error(`[projects] No URL for earlier project: ${project.name}`);
    const note = 'note' in project && project.note
      ? project.note
      : repo ? String(new Date(repo.pushed_at).getUTCFullYear()) : '';
    return { name: project.name, url, description: project.description, note };
  });

  return { active, earlier, asOf };
}
