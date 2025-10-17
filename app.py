import streamlit as st

# عنوان اصلی
st.title("🤖 CodeSignal MVP")
st.markdown("---")

# سایدبار منو
st.sidebar.title("منو")
page = st.sidebar.selectbox("صفحه انتخابی", ["🏠 صفحه اصلی", "💻 FizzBuzz"])

if page == "🏠 صفحه اصلی":
    st.header("به CodeSignal MVP خوش آمدید! 🎉")
    st.write("• اولین مسئله: **FizzBuzz**")
    st.write("• کد بنویسید و تست کنید!")
    if st.button("🚀 برو FizzBuzz"):
        st.sidebar.selectbox("صفحه انتخابی", ["💻 FizzBuzz"])  # خودکار بره اونجا
        
elif page == "💻 FizzBuzz":
    st.header("🍋 FizzBuzz - آسان")
    
    # توضیح مسئله
    st.markdown("""
    **صورت مسئله:**
    عددی n بنویسید که:
    • اگر به 3 بخش‌پذیر باشد: "Fizz"
    • اگر به 5 بخش‌پذیر باشد: "Buzz"  
    • اگر به هر دو: "FizzBuzz"
    • وگرنه: عدد خودش
    """)
    
    # نمونه‌ها
    st.subheader("📝 نمونه‌ها")
    st.write("**ورودی:** n = 3 → **خروجی:** Fizz")
    st.write("**ورودی:** n = 5 → **خروجی:** Buzz") 
    st.write("**ورودی:** n = 15 → **خروجی:** FizzBuzz")
    
    # ویرایشگر کد
    st.subheader("✏️ کد خود را بنویسید (Python)")
    code = st.text_area("کد:", 
                       value="def fizzbuzz(n):\n    if n % 15 == 0:\n        return 'FizzBuzz'\n    elif n % 3 == 0:\n        return 'Fizz'\n    elif n % 5 == 0:\n        return 'Buzz'\n    else:\n        return str(n)",
                       height=200)
    
    # دکمه ارسال
    if st.button("🚀 ارسال و تست", type="primary"):
        st.success("✅ کد ارسال شد! (قدم بعدی: اجرای واقعی)")
        st.code(code, language="python")