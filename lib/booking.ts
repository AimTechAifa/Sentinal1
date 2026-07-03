import { prisma } from "@/lib/prisma";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd;
}

export async function checkBookingAvailability(applicationIds: string[], fromDate: Date, toDate: Date) {
  const bookings = await prisma.envBooking.findMany({
    where: { applicationId: { in: applicationIds }, status: "BOOKED" },
    include: { application: true, environment: true },
  });

  const conflicts = applicationIds.flatMap((appId) => {
    const hit = bookings
      .filter((b) => b.applicationId === appId)
      .find((b) => overlaps(fromDate, toDate, b.fromDate, b.toDate));
    if (!hit) return [];
    return [
      {
        applicationId: appId,
        applicationName: hit.application.name,
        bookedBy: hit.bookedBy,
        team: hit.team,
        departmentName: hit.departmentName,
        fromDate: hit.fromDate,
        toDate: hit.toDate,
        purpose: hit.purpose,
        environmentName: hit.environment?.name,
      },
    ];
  });

  return { available: conflicts.length === 0, conflicts };
}
