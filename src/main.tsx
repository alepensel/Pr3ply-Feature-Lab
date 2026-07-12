import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
const requiredConfig = [
  ["VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL],
  ["VITE_SUPABASE_PUBLISHABLE_KEY", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY],
] as const;
const missingConfig = requiredConfig
  .filter(([, value]) => !value)
  .map(([name]) => name);

function ConfigurationError({ message }: { message?: string }) {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-xl rounded-lg border border-destructive/30 bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold text-destructive">Configuration required</p>
        <h1 className="mt-2 text-2xl font-bold">Pr3ply is not ready to start</h1>
        <p className="mt-4 text-muted-foreground">
          The deployment is missing its Supabase connection settings. Add the
          Supabase URL and publishable key to the hosting environment, then
          rebuild and republish the app.
        </p>
        {missingConfig.length > 0 && (
          <p className="mt-4 rounded-md bg-muted p-3 font-mono text-sm">
            Missing: {missingConfig.join(", ")}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

if (missingConfig.length > 0) {
  root.render(<ConfigurationError />);
} else {
  void import("./App.tsx")
    .then(({ default: App }) => root.render(<App />))
    .catch((error: unknown) => {
      console.error("Unable to start Pr3ply", error);
      root.render(
        <ConfigurationError message="The application could not be loaded. Check the deployment logs and retry the build." />
      );
    });
}
