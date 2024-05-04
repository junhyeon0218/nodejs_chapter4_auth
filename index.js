// 필요한 모듈들을 불러옵니다.
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();

const secretText = "OZCoding";
const refreshText = "OZCodingOZ";

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const refreshTokens = [];
const posts = [
  {
    username: "admin",
    title: "post 1",
  },
];

app.post("/login", (req, res) => {
  const username = req.body.username;
  const user = { name: username };

  const accessToken = jwt.sign(user, secretText, { expiresIn: "30s" });
  const refreshToken = jwt.sign(user, refreshText, { expiresIn: "30m" });

  refreshTokens.push(refreshToken);

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  }); // 리프레시 토큰을 쿠키에 저장
  res.json({ accessToken: accessToken });
});

// 토큰 검증 미들웨어 함수
function middelware(req, res, next) {
  // 클라이언트로부터 받은 액세스 토큰
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN에서 TOKEN만 추출

  if (token == null) return res.sendStatus(401); // 토큰이 없을 경우 401 Unauthorized 응답

  jwt.verify(token, secretText, (err, user) => {
    if (err) {
      return res.sendStatus(403); // 토큰이 유효하지 않을 경우 403 Forbidden 응답
    }
    req.user = user; // 요청 객체에 user 정보 추가
    next(); // 다음 미들웨어 함수로 넘어감
  });
}

app.get("/posts", middelware, (req, res) => {
  res.json(posts); // 포스트 데이터 응답
});

// 리프레시 토큰 라우트 추가
app.get("/refresh", (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, secretText, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign(
      { name: user.name },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" }
    );
    res.ison({ accessToken });
  });
});

// 서버가 4000번 포트에서 듣기를 시작합니다. 서버가 시작되면 콘솔에 메시지를 출력합니다.
const port = 4000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
