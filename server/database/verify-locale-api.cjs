async function main() {
  const ar = await (await fetch("http://localhost:3009/api/language/locale/ar")).json();
  const en = await (await fetch("http://localhost:3009/api/language/locale/en")).json();
  console.log("API en=", Object.keys(en).length, "ar=", Object.keys(ar).length);
  for (const k of ["login", "dashboard", "attendanceTracking", "noticeBoard", "save", "users"]) {
    console.log(k + ":", ar[k]);
  }
}
main();
