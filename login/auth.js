// Placeholder strings will be replaced in CI:
const USER_HASH = "__USER_HASH__";
const PASS_HASH = "__PASS_HASH__";

async function sha256(text){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

document.getElementById("loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const f = new FormData(e.target);
  const uOK = await sha256(f.get("user")) === USER_HASH;
  const pOK = await sha256(f.get("pass")) === PASS_HASH;
  if(uOK && pOK){
    location.href = "quiz_app.html";            // 🔐 success
  }else{
    document.getElementById("msg").textContent = "Invalid credentials.";
  }
});
