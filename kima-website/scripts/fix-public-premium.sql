-- PUBLIC 섹션에 있으면서 PREMIUM 접근 등급인 자료는 어디서도 안 보임 → MINISTRY로 이동
UPDATE "Resource"
SET section = 'MINISTRY'
WHERE section = 'PUBLIC' AND "accessLevel" = 'PREMIUM';
