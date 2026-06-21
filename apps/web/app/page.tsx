"use client"

import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter()
  function start() {
    router.push('/track')
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#f0ede8",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          height: 70,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          position: "sticky",
          top: 0,
          backdropFilter: "blur(20px)",
          background: "rgba(13,13,13,0.8)",
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Uptime
        </h2>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >

          <button
            style={{
              background: "#f0ede8",
              color: "#0d0d0d",
              border: "none",
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
            onClick={() => start()}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "120px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            fontSize: 13,
            color: "rgba(240,237,232,0.6)",
          }}
        >
          🌍 Global Website Monitoring
        </div>

        <h1
          style={{
            fontSize: "clamp(48px, 8vw, 92px)",
            lineHeight: 1,
            marginTop: 30,
            marginBottom: 24,
            letterSpacing: "-0.05em",
            fontWeight: 700,
          }}
        >
          Monitor Your
          <br />
          Websites From
          <br />
          Everywhere
        </h1>

        <p
          style={{
            maxWidth: 700,
            margin: "0 auto",
            fontSize: 20,
            color: "rgba(240,237,232,0.55)",
            lineHeight: 1.7,
          }}
        >
          Track uptime, response times and outages from multiple
          regions worldwide. Get alerted before your customers
          even notice.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              background: "#f0ede8",
              color: "#0d0d0d",
              border: "none",
              padding: "14px 28px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => start()}
          >
            Start Monitoring
          </button>


        </div>
        

        {/* Stats */}
        <div
          style={{
            marginTop: 100,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 20,
          }}
        >
          {[
            ["99.99%", "Uptime Tracking"],
            ["15+", "Regions"],
            ["24/7", "Monitoring"],
            ["89ms", "Average Response"],
          ].map(([value, label]) => (
            <div
              key={label}
              style={{
                background: "#161616",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 30,
              }}
            >
              <h3
                style={{
                  fontSize: 42,
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {value}
              </h3>

              <p
                style={{
                  color: "rgba(240,237,232,0.5)",
                  margin: 0,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div
          style={{
            marginTop: 100,
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 32,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {[
              "api.myapp.com",
              "dashboard.myapp.com",
              "store.myapp.com",
            ].map((site) => (
              <div
                key={site}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 18,
                  borderRadius: 12,
                  background: "#111111",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />

                  {site}
                </div>

                <span
                  style={{
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  Operational
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
