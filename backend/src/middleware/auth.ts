import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diset di environment variables (.env)");
}

/**
 * Bentuk data yang disimpan dalam token saat login related dengan routes/auth.ts.
 */
interface AuthTokenPayload {
  investorId: number;
  email: string;
}

/**
 * Bentuk data yang disimpan dalam token saat login related dengan routes/admin.ts.
 */
interface AdminTokenPayload {
  adminId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      investor?: AuthTokenPayload;
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Middleware untuk melindungi endpoint yang wajib login (mis. kelola target, notifikasi, update profil investor).
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  /**
   * Format yang diharapkan: header "Authorization: Bearer <token>". Jika header tidak ada atau formatnya salah, tolak sebelum sempat verifikasi JWT.
   */
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token otentikasi tidak ditemukan",
    });
  }

  /**
   * Ambil bagian token saja
   */
  const token = authHeader.slice("Bearer ".length);

  try {
    /**
     * Verifikasi dilakukan dengan 2 cara yaitu kesesuaian token dengan JWT_SECRET dan token belum melewati masa expired.
     */
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === "string" || !("investorId" in payload)) {
      return res.status(403).json({
        success: false,
        message: "Token ini bukan token investor",
      });
    }

    req.investor = payload as AuthTokenPayload;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
};

/**
 * Middleware untuk melindungi endpoint dashboard admin
 */
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token otentikasi tidak ditemukan",
    });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    if (typeof payload === "string" || !("adminId" in payload)) {
      return res.status(403).json({
        success: false,
        message: "Token ini bukan token admin",
      });
    }

    req.admin = payload as AdminTokenPayload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
};
