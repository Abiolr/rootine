-- CreateEnum
CREATE TYPE "TreeStatus" AS ENUM ('SEED', 'SAPLING', 'JUVENILE', 'GROWN', 'DEAD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "penalty_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "TreeStatus" NOT NULL DEFAULT 'SEED',
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;
