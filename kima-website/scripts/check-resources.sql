SELECT section, "accessLevel", COUNT(*) as count
FROM "Resource"
GROUP BY section, "accessLevel"
ORDER BY section, "accessLevel";
