type ActivitySummaryEmailProps = {
  name: string;
  completedCount: number;
};

export function ActivitySummaryEmail({
  name,
  completedCount,
}: ActivitySummaryEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#0f172a",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Nice work, {name}.</h1>
      <p style={{ margin: 0 }}>
        You completed {completedCount} tracked activities today. Keep the streak
        going tomorrow.
      </p>
    </div>
  );
}
