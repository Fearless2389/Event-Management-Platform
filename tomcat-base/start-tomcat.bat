@echo off
set JAVA_HOME=C:\Users\ruthv\.jdk\jdk-11.0.28
set CATALINA_HOME=C:\ProgramData\chocolatey\lib\tomcat\tools\apache-tomcat-9.0.117
set CATALINA_BASE=%~dp0
"%CATALINA_HOME%\bin\catalina.bat" run
