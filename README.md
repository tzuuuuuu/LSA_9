# DJ(?
## Concept Development 動機
製作一個音樂編輯器，想讓所有人能夠連得到樹梅派，可自動上傳想要的音樂去做編輯，也可直接使用內建音樂，在音樂上做出一些音效或燈光的效果

## Implementation Resources 用到的資源
- 硬體
  - 樹梅派
  - 電腦
  - 喇叭
- 軟體
  - Python
  - Pygame
  - Apache

## Existing Library/Sofrware 套件
- Python
- Pygame
- Apache

## Implementation Process 執行過程
- 確認 SSH 已經成功連接:`ssh LSA@<樹莓派IP>`
- 準備樹莓派環境:
  - (1)更新系統與安裝必要的工具`sudo apt update && sudo apt upgrade -y` -> `sudo apt install python3 python3-pip python3-venv git -y`
  - (2) 創建一個專案目錄:`mkdir ~/flask_project` -> `cd ~/flask_project`
- 將專案從電腦上傳到樹莓派
- 在樹莓派上設定 Flask 專案
  - (1)進入專案目錄並創建虛擬環境:`cd ~/flask_project` -> `python3 -m venv venv` -> `source venv/bin/activate`
  - (2) 安裝所需的 Python 套件:`pip install -r requirements.txt`
- 運行 Flask 應用
  - (1) 測試 Flask 應用:`export FLASK_APP=app.py` -> `flask run --host=0.0.0.0`
  - (2) 使用 Gunicorn 或其他 WSGI Server（建議）:`pip install gunicorn` -> `gunicorn --bind 0.0.0.0:5000 app:app`
- 可選：設置自動啟動服務
  - (1)創建一個服務檔案:`sudo nano /etc/systemd/system/flask_project.service`
  - (2)添加以下內容:
  - ```ini
    [Unit]
    Description=Flask Project
    After=network.target
    
    [Service]
    User=pi
    WorkingDirectory=/home/pi/flask_project
    ExecStart=/home/pi/flask_project/venv/bin/gunicorn --bind 0.0.0.0:5000 app:app
    Restart=always
    
    [Install]
    WantedBy=multi-user.target
    ```
  - (3)啟動並啟用服務:`sudo systemctl start flask_project` -> `sudo systemctl enable flask_project`

## Knowledge from Lecture 善用所學
- Linux 系統基本指令

## Installation 前置下載(怎麼安裝
**以下環境皆為Linux**
- 在SD卡灌入樹梅派系統
- 設定 WiFi 以及 SSH
  - WiFi:`sudo raspi-config` -> `System Option` -> `Wireless LAN`
  - SSH :`Interface Option` -> `SSH` -> 選擇 Yes

 ### 安裝軟體
- 安裝 Apache
  - `sudo apt install apache2`
    ### 使用 Flask + Nginx需安裝
#### 安裝必要的軟體
  -`sudo apt install python3 python3-pip python3-venv nginx -y`
#### 建立並啟動 Flask 專案
###### 1.建立專案資料夾
  -`mkdir ~/my_flask_app`
  -`cd ~/my_flask_app`
###### 2.設定虛擬環境
  -`python3 -m venv venv`
  -`source venv/bin/activate`
###### 3.安裝 Flask
  -`pip install flask`
###### 4.建立 Flask 應用程式(在 ~/my_flask_app 中建立檔案 app.py)
`from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, Flask with Nginx!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)`
###### 5.測試 Flask 應用
  -`python app.py`
##### 6.編輯 Nginx 配置檔
  -`sudo nano /etc/nginx/sites-available/flask_app'
  ###### 添加以下內容:
   ```server {
    listen 80;
    server_name 192.168.0.105; # 或者使用域名替代 IP
    location / {
        proxy_pass http://192.168.0.105:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
##### 7.啟用 Nginx 配置
  ###### 建立符號連結啟用配置檔案
  -`sudo ln -s /etc/nginx/sites-available/flask_app /etc/nginx/sites-enabled/`
  ###### 測試 Nginx 配置是否正確
  -`sudo nginx -t`
  ###### 重新啟動 Nginx
  -`sudo systemctl restart nginx`
##### 8.使用 Gunicorn 啟動 Flask 應用
  ###### 安裝 Gunicorn
  -`pip install gunicorn`
  ###### 啟動應用
  -`gunicorn --workers 3 --bind 127.0.0.1:5000 app:app`
  ###### 設置 Systemd 自動啟動服務
  -`sudo nano /etc/systemd/system/my_flask_app.service`
  ###### 添加以下內容:
  ```[Unit]
  Description=Gunicorn instance to serve Flask App
  After=network.target
  [Service]
  User=your_username
  Group=www-data
  WorkingDirectory=/home/your_username/my_flask_app
  Environment="PATH=/home/your_username/my_flask_app/venv/bin"
  ExecStart=/home/your_username/my_flask_app/venv/bin/gunicorn --workers 3 --bind      127.0.0.1:5000 app:app
  [Install]
  WantedBy=multi-user.target```
##### 9.啟用並啟動服務
  -`sudo systemctl daemon-reload`
  -`sudo systemctl start my_flask_ap`
  -`sudo systemctl enable my_flask_app`

## Usage (怎麼操作

## Job Assignment

## References 參考資料

