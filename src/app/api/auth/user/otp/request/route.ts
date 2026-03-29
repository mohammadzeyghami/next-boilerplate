import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  generateOtpCode,
  signOtpJwt,
} from "@/lib/user-auth/otp-jwt";
import { sendOtpEmail, sendOtpSms } from "@/lib/user-auth/notify";
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizePhone,
} from "@/lib/user-auth/validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      value?: string;
      type?: "EMAIL" | "PHONE_NUMBER";
    };
    const type = body.type;
    const raw = typeof body.value === "string" ? body.value.trim() : "";

    if (type === "PHONE_NUMBER") {
      const phone = normalizePhone(raw);
      if (!isValidPhoneNumber(phone)) {
        return NextResponse.json(
          { code: "PHONE_NUMBER_IS_NOT_VALID" },
          { status: 400 },
        );
      }
    } else if (type === "EMAIL") {
      if (!isValidEmail(raw)) {
        return NextResponse.json(
          { code: "EMAIL_IS_NOT_VALID" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json({ code: "INVALID_TYPE" }, { status: 400 });
    }

    const valueNorm =
      type === "EMAIL" ? raw.toLowerCase() : normalizePhone(raw);

    const existing = await prisma.userAuth.findFirst({
      where:
        type === "EMAIL"
          ? { email: valueNorm }
          : { phoneNumber: valueNorm },
      select: { id: true },
    });

    const otpCode = generateOtpCode(6);
    const token = await signOtpJwt({
      userAuthId: existing?.id,
      value: valueNorm,
      type,
      otpCode,
    });

    if (type === "PHONE_NUMBER") {
      await sendOtpSms(valueNorm, otpCode);
    } else {
      await sendOtpEmail(valueNorm, otpCode);
    }

    return NextResponse.json(
      { token },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
