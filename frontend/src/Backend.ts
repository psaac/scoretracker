export default class Backend {
  private static baseUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  public static get = async ({ path }: { path: string }) => {
    const response = await fetch(`${this.baseUrl}/${path}`);
    if (response.ok) {
      return await response.json();
    } else {
      return null;
      // TODO : show errors on UI
    }
  };

  public static post = async (
    { path, body }: { path: string; body?: unknown },
    options: RequestInit = {},
  ) => {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (response.ok) {
      return await response.json();
    } else {
      return null;
      // TODO : show errors on UI
    }
  };
}
