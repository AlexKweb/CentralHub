/********************************************************************************
** Form generated from reading UI file 'mainwindow.ui'
**
** Created by: Qt User Interface Compiler version 6.10.2
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QPlainTextEdit>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QTabWidget>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_MainWindow
{
public:
    QWidget *centralwidget;
    QTabWidget *tabWidget;
    QWidget *tab;
    QLabel *label;
    QLineEdit *inputTask1A;
    QLabel *label_2;
    QLineEdit *inputTask1B;
    QPushButton *btnTask1;
    QLabel *label_3;
    QLabel *task1ResultGcd;
    QLabel *label_4;
    QLabel *task1ResultLcm;
    QWidget *tab_2;
    QLabel *label_5;
    QLineEdit *inputTask2;
    QPushButton *btnTask2;
    QLabel *task2Result;
    QWidget *tab_3;
    QLabel *label_6;
    QLineEdit *inputTask3Start;
    QLabel *label_7;
    QLineEdit *inputTask3End;
    QPushButton *btnTask3;
    QPlainTextEdit *task3Result;
    QWidget *tab_4;
    QLabel *label_8;
    QLineEdit *inputTask4A;
    QLabel *label_9;
    QLineEdit *inputTask4B;
    QLabel *label_10;
    QLineEdit *inputTask4C;
    QPushButton *btnTask4;
    QLabel *task4Result;
    QWidget *tab_5;
    QLabel *label_11;
    QLineEdit *inputTask5;
    QPushButton *btnTask5;
    QLabel *task5Result;
    QMenuBar *menubar;
    QStatusBar *statusbar;

    void setupUi(QMainWindow *MainWindow)
    {
        if (MainWindow->objectName().isEmpty())
            MainWindow->setObjectName("MainWindow");
        MainWindow->resize(700, 500);
        centralwidget = new QWidget(MainWindow);
        centralwidget->setObjectName("centralwidget");
        tabWidget = new QTabWidget(centralwidget);
        tabWidget->setObjectName("tabWidget");
        tabWidget->setGeometry(QRect(20, 20, 651, 431));
        tab = new QWidget();
        tab->setObjectName("tab");
        label = new QLabel(tab);
        label->setObjectName("label");
        label->setGeometry(QRect(40, 30, 91, 20));
        inputTask1A = new QLineEdit(tab);
        inputTask1A->setObjectName("inputTask1A");
        inputTask1A->setGeometry(QRect(160, 30, 161, 22));
        label_2 = new QLabel(tab);
        label_2->setObjectName("label_2");
        label_2->setGeometry(QRect(40, 70, 91, 20));
        inputTask1B = new QLineEdit(tab);
        inputTask1B->setObjectName("inputTask1B");
        inputTask1B->setGeometry(QRect(160, 70, 161, 22));
        btnTask1 = new QPushButton(tab);
        btnTask1->setObjectName("btnTask1");
        btnTask1->setGeometry(QRect(160, 120, 121, 32));
        label_3 = new QLabel(tab);
        label_3->setObjectName("label_3");
        label_3->setGeometry(QRect(40, 190, 71, 20));
        task1ResultGcd = new QLabel(tab);
        task1ResultGcd->setObjectName("task1ResultGcd");
        task1ResultGcd->setGeometry(QRect(160, 190, 231, 20));
        label_4 = new QLabel(tab);
        label_4->setObjectName("label_4");
        label_4->setGeometry(QRect(40, 230, 71, 20));
        task1ResultLcm = new QLabel(tab);
        task1ResultLcm->setObjectName("task1ResultLcm");
        task1ResultLcm->setGeometry(QRect(160, 230, 231, 20));
        tabWidget->addTab(tab, QString());
        tab_2 = new QWidget();
        tab_2->setObjectName("tab_2");
        label_5 = new QLabel(tab_2);
        label_5->setObjectName("label_5");
        label_5->setGeometry(QRect(40, 40, 111, 20));
        inputTask2 = new QLineEdit(tab_2);
        inputTask2->setObjectName("inputTask2");
        inputTask2->setGeometry(QRect(170, 40, 171, 22));
        btnTask2 = new QPushButton(tab_2);
        btnTask2->setObjectName("btnTask2");
        btnTask2->setGeometry(QRect(170, 90, 121, 32));
        task2Result = new QLabel(tab_2);
        task2Result->setObjectName("task2Result");
        task2Result->setGeometry(QRect(40, 160, 381, 20));
        tabWidget->addTab(tab_2, QString());
        tab_3 = new QWidget();
        tab_3->setObjectName("tab_3");
        label_6 = new QLabel(tab_3);
        label_6->setObjectName("label_6");
        label_6->setGeometry(QRect(40, 30, 141, 20));
        inputTask3Start = new QLineEdit(tab_3);
        inputTask3Start->setObjectName("inputTask3Start");
        inputTask3Start->setGeometry(QRect(190, 30, 151, 22));
        label_7 = new QLabel(tab_3);
        label_7->setObjectName("label_7");
        label_7->setGeometry(QRect(40, 70, 141, 20));
        inputTask3End = new QLineEdit(tab_3);
        inputTask3End->setObjectName("inputTask3End");
        inputTask3End->setGeometry(QRect(190, 70, 151, 22));
        btnTask3 = new QPushButton(tab_3);
        btnTask3->setObjectName("btnTask3");
        btnTask3->setGeometry(QRect(190, 120, 111, 32));
        task3Result = new QPlainTextEdit(tab_3);
        task3Result->setObjectName("task3Result");
        task3Result->setGeometry(QRect(40, 180, 551, 171));
        tabWidget->addTab(tab_3, QString());
        tab_4 = new QWidget();
        tab_4->setObjectName("tab_4");
        label_8 = new QLabel(tab_4);
        label_8->setObjectName("label_8");
        label_8->setGeometry(QRect(40, 30, 101, 20));
        inputTask4A = new QLineEdit(tab_4);
        inputTask4A->setObjectName("inputTask4A");
        inputTask4A->setGeometry(QRect(150, 30, 161, 22));
        label_9 = new QLabel(tab_4);
        label_9->setObjectName("label_9");
        label_9->setGeometry(QRect(40, 70, 101, 20));
        inputTask4B = new QLineEdit(tab_4);
        inputTask4B->setObjectName("inputTask4B");
        inputTask4B->setGeometry(QRect(150, 70, 161, 22));
        label_10 = new QLabel(tab_4);
        label_10->setObjectName("label_10");
        label_10->setGeometry(QRect(40, 110, 101, 20));
        inputTask4C = new QLineEdit(tab_4);
        inputTask4C->setObjectName("inputTask4C");
        inputTask4C->setGeometry(QRect(150, 110, 161, 22));
        btnTask4 = new QPushButton(tab_4);
        btnTask4->setObjectName("btnTask4");
        btnTask4->setGeometry(QRect(150, 160, 111, 32));
        task4Result = new QLabel(tab_4);
        task4Result->setObjectName("task4Result");
        task4Result->setGeometry(QRect(40, 230, 541, 20));
        tabWidget->addTab(tab_4, QString());
        tab_5 = new QWidget();
        tab_5->setObjectName("tab_5");
        label_11 = new QLabel(tab_5);
        label_11->setObjectName("label_11");
        label_11->setGeometry(QRect(40, 40, 181, 20));
        inputTask5 = new QLineEdit(tab_5);
        inputTask5->setObjectName("inputTask5");
        inputTask5->setGeometry(QRect(240, 40, 141, 22));
        btnTask5 = new QPushButton(tab_5);
        btnTask5->setObjectName("btnTask5");
        btnTask5->setGeometry(QRect(240, 90, 121, 32));
        task5Result = new QLabel(tab_5);
        task5Result->setObjectName("task5Result");
        task5Result->setGeometry(QRect(40, 170, 511, 20));
        tabWidget->addTab(tab_5, QString());
        MainWindow->setCentralWidget(centralwidget);
        menubar = new QMenuBar(MainWindow);
        menubar->setObjectName("menubar");
        menubar->setGeometry(QRect(0, 0, 700, 24));
        MainWindow->setMenuBar(menubar);
        statusbar = new QStatusBar(MainWindow);
        statusbar->setObjectName("statusbar");
        MainWindow->setStatusBar(statusbar);

        retranslateUi(MainWindow);

        tabWidget->setCurrentIndex(0);


        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QCoreApplication::translate("MainWindow", "lab 1 qt", nullptr));
        label->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 a", nullptr));
        label_2->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 b", nullptr));
        btnTask1->setText(QCoreApplication::translate("MainWindow", "\320\237\320\276\321\201\321\207\320\270\321\202\320\260\321\202\321\214", nullptr));
        label_3->setText(QCoreApplication::translate("MainWindow", "\320\235\320\236\320\224", nullptr));
        task1ResultGcd->setText(QCoreApplication::translate("MainWindow", "0", nullptr));
        label_4->setText(QCoreApplication::translate("MainWindow", "\320\235\320\236\320\232", nullptr));
        task1ResultLcm->setText(QCoreApplication::translate("MainWindow", "0", nullptr));
        tabWidget->setTabText(tabWidget->indexOf(tab), QCoreApplication::translate("MainWindow", "1", nullptr));
        label_5->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 \321\207\320\270\321\201\320\273\320\276", nullptr));
        btnTask2->setText(QCoreApplication::translate("MainWindow", "\320\237\321\200\320\276\320\262\320\265\321\200\320\270\321\202\321\214", nullptr));
        task2Result->setText(QCoreApplication::translate("MainWindow", "\320\236\321\202\320\262\320\265\321\202", nullptr));
        tabWidget->setTabText(tabWidget->indexOf(tab_2), QCoreApplication::translate("MainWindow", "2", nullptr));
        label_6->setText(QCoreApplication::translate("MainWindow", "\320\235\320\260\321\207\320\260\320\273\320\276 \320\270\320\275\321\202\320\265\321\200\320\262\320\260\320\273\320\260", nullptr));
        label_7->setText(QCoreApplication::translate("MainWindow", "\320\232\320\276\320\275\320\265\321\206 \320\270\320\275\321\202\320\265\321\200\320\262\320\260\320\273\320\260", nullptr));
        btnTask3->setText(QCoreApplication::translate("MainWindow", "\320\235\320\260\320\271\321\202\320\270", nullptr));
        tabWidget->setTabText(tabWidget->indexOf(tab_3), QCoreApplication::translate("MainWindow", "3", nullptr));
        label_8->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 a", nullptr));
        label_9->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 b", nullptr));
        label_10->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 c", nullptr));
        btnTask4->setText(QCoreApplication::translate("MainWindow", "\320\240\320\265\321\210\320\270\321\202\321\214", nullptr));
        task4Result->setText(QCoreApplication::translate("MainWindow", "\320\236\321\202\320\262\320\265\321\202", nullptr));
        tabWidget->setTabText(tabWidget->indexOf(tab_4), QCoreApplication::translate("MainWindow", "4", nullptr));
        label_11->setText(QCoreApplication::translate("MainWindow", "\320\222\320\262\320\265\320\264\320\270\321\202\320\265 \320\272\320\276\320\273\320\270\321\207\320\265\321\201\321\202\320\262\320\276 \320\267\320\275\320\260\320\272\320\276\320\262", nullptr));
        btnTask5->setText(QCoreApplication::translate("MainWindow", "\320\237\320\276\321\201\321\207\320\270\321\202\320\260\321\202\321\214", nullptr));
        task5Result->setText(QCoreApplication::translate("MainWindow", "\320\236\321\202\320\262\320\265\321\202", nullptr));
        tabWidget->setTabText(tabWidget->indexOf(tab_5), QCoreApplication::translate("MainWindow", "5", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
