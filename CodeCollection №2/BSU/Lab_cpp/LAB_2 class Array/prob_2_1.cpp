#include "Array.h"
#include <string>
#include <algorithm>

int main() {
    std::cout << "Введите натуральное число: ";
    std::string number;
    std::cin >> number;

    Array<int> counts(10);
    for (size_t i = 0; i < 10; ++i) {
        counts.add(0);
    }

    for (char ch : number) {
        if (ch < '0' || ch > '9') {
            std::cout << "Некорректный ввод";
            return 0;
        }
        counts[ch - '0'] = counts[ch - '0'] + 1;
    }

    int oddCount = 0;
    int middleDigit = -1;
    for (int i = 0; i < 10; ++i) {
        if (counts[i] % 2 != 0) {
            oddCount++;
            middleDigit = i;
        }
    }

    if (oddCount > 1) {
        std::cout << "Палиндром составить нельзя";
        return 0;
    }

    std::string half;
    for (int i = 0; i < 10; ++i) {
        for (int k = 0; k < counts[i] / 2; ++k) {
            half.push_back(static_cast<char>('0' + i));
        }
    }

    std::string result = half;
    if (middleDigit != -1) {
        result.push_back(static_cast<char>('0' + middleDigit));
    }
    std::reverse(half.begin(), half.end());
    result += half;

    std::cout << "Полученный палиндром: " << result;
    return 0;
}
