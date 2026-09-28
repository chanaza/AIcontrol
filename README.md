# AI Usage Control Plane

מערכת ניהול מרכזית לשימוש ארגוני ב-AI. ספקים שונים מזרימים אירועים למודל אחיד, והמערכת מציגה שימוש, עלויות ותגיות מנורמלות באותו דשבורד.

## הפעלה

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

פתחו את `http://127.0.0.1:8000`, ולחצו על "טעינת נתוני הדגמה". תיעוד ה-API זמין ב-`/docs`.

הממשק כולל סקירה, חיבורים וכיסוי נתונים. פעולת "חיבור ספק" מדמה כרגע הסכמה מוצלחת ומעדכנת את סטטוס החיבור; בייצור היא תוחלף ב־OAuth או בהזנת מפתח דרך מנהל סודות.

## תגיות מאוחדות

`POST /api/tenants/{tenant_id}/events` מקבל אירועים מכל ספק. התגיות עוברות נרמול, למשל `prod` ו-`production` הופכות ל-`environment:production`; כל אירוע גם מקבל `vendor:<name>` ו-`department:<name>`. כך `/api/tags` מספק ניתוח אחד שחוצה ספקים.

השלב הבא הוא להוסיף adapters לכל מחבר כדי שיכתבו `ActivityEvent` לאחר סנכרון מאובטח.
