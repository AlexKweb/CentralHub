#include <iostream>
using namespace std;

class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {

        vector<vector<string>> strsRez;

        // for(int i = 0; i < strs.size(); i++){
        //     sort(strs[i].begin(), strs[i].end());
        // }

        int k = 0;

        for (int i = 0; i < strs.size(); i++) {
            strsRez.push_back(vector<string>{strs[i]});
            for (int j = i + 1; j < strs.size(); j++) {
                string s1 = strs[i];
                string s2 = strs[j];
                sort(s1.begin(), s1.end());
                sort(s2.begin(), s2.end());

                if (s1 == s2) {
                    strsRez[i].push_back(strs[j]);
                    strs.erase(strs.begin() + j);
                }
            }
        }
        sort(strsRez.begin(), strsRez.end());

        return strsRez;
    }
};

int main() {
    vector<string> strs;
    cout << "Enter elem:\n";
    for (int i = 0; i < 3; i++) {
        getline(cin, strs[i]);
    }
    Solution mysol;
    mysol.groupAnagrams(strs);
    return 0;
}