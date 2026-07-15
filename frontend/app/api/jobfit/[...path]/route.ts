const BACKEND_URL = (process.env.JOBFIT_API_URL || process.env.NEXT_PUBLIC_JOBFIT_API_URL || "https://jobfit-api-production.up.railway.app").replace(/\/$/, "");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { path?: string[] } };

async function proxyJobFitRequest(request: Request, context: RouteContext) {
  const path = (context.params.path || []).join("/");
  const requestUrl = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/${path}${requestUrl.search}`;
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual"
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach JobFIT backend";
    return Response.json({ detail: `Unable to reach JobFIT backend: ${message}` }, { status: 502 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  return proxyJobFitRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyJobFitRequest(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxyJobFitRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxyJobFitRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyJobFitRequest(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return proxyJobFitRequest(request, context);
}
