-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "subAccounttoken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_subAccounttoken_idx" ON "User"("subAccounttoken");
