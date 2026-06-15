@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d C:\kafka
bin\windows\kafka-server-start.bat config\kraft\server.properties
