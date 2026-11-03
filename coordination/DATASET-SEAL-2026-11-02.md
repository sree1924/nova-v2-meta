# DATASET SEAL — PassLearnersPermit v1 (2026-11-02)

Founder, 2026-11-02 ~22:20Z: "I want this endless build to close, really, at least on the dataset." This file is the close.

## Sealed: the 51 state payloads
254,314 files · 188.29 GB · every file sha256-listed in its state's `coordination/FABLE-DROPOFF/states/<xx>/cdn-manifest.json` ·
every manifest independently verified by Fable's watcher (0 issues, 0 missing, 0 sha mismatches, free tier = section 01 only).

**SEAL = sha256 over the 51 `cdn-manifest.json` files, concatenated alphabetically by state code:**

```
ed1c97a96e7bb2473aa6214b9a9434f61eba243e9d6c3623086c238deb87724f
```

Re-derive any time:
```
node -e "const fs=require('fs'),c=require('crypto');const h=c.createHash('sha256');for(const s of fs.readdirSync('coordination/FABLE-DROPOFF/states').sort())h.update(fs.readFileSync('coordination/FABLE-DROPOFF/states/'+s+'/cdn-manifest.json'));console.log(h.digest('hex'))"
```
Any byte changed in any payload changes its manifest and breaks the seal. A new seal = a new dataset version (v2), never a
silent edit.

| state | files | GB | staged | manifest sha256 |
|---|---:|---:|---|---|
| AK | 4,803 | 2.86 | 2026-11-02T16:14Z | 10e18b76e418a6b1… |
| AL | 4,461 | 2.94 | 2026-11-02T05:05Z | 83a7143a8696de7c… |
| AR | 4,384 | 2.47 | 2026-11-02T07:51Z | e7d0e60d477bf715… |
| AZ | 7,602 | 5.12 | 2026-11-02T00:27Z | f5977a1d0549e186… |
| CA | 2,845 | 2.24 | 2026-11-02T01:56Z | bc77050c0a27ecaa… |
| CO | 4,536 | 4.01 | 2026-11-02T03:53Z | 3d314230650e86a1… |
| CT | 3,191 | 3.21 | 2026-11-02T06:46Z | 222a96cc060b653d… |
| DC | 4,101 | 2.32 | 2026-11-02T16:37Z | cd35286697a8e074… |
| DE | 9,133 | 7.46 | 2026-11-02T15:15Z | 6602cb3bf3dc21cf… |
| FL | 3,375 | 2.37 | 2026-11-02T01:56Z | 7f4c9f4c4e79b975… |
| GA | 4,228 | 3.03 | 2026-11-02T01:57Z | fb2f1229bc3ca6d2… |
| HI | 5,067 | 3.53 | 2026-11-02T12:53Z | fa53dd6a595ca7f0… |
| IA | 4,213 | 3.04 | 2026-11-02T07:08Z | 5585edfe28180c28… |
| ID | 6,571 | 4.45 | 2026-11-02T12:23Z | 63ec75795160e3b8… |
| IL | 5,444 | 3.41 | 2026-11-02T01:57Z | ce1ad4922b24273a… |
| IN | 3,639 | 2.11 | 2026-11-02T02:15Z | 66899e53c9531992… |
| KS | 8,077 | 5.11 | 2026-11-02T08:27Z | be0c66b06d6f3824… |
| KY | 2,785 | 1.82 | 2026-11-02T05:45Z | b9f61c2e92664337… |
| LA | 6,534 | 2.78 | 2026-11-02T05:29Z | 2923567e4c9ed52d… |
| MA | 7,568 | 4.20 | 2026-11-02T01:00Z | 9cf4314182a7edb2… |
| MD | 3,965 | 3.05 | 2026-11-02T03:09Z | 4ab870bd532a399b… |
| ME | 5,925 | 2.40 | 2026-11-02T13:36Z | 87fb1e9d73d6ad90… |
| MI | 4,980 | 3.96 | 2026-11-02T01:58Z | c34fb42aa44c2762… |
| MN | 5,757 | 3.74 | 2026-11-02T04:19Z | a9f9740df491b643… |
| MO | 6,530 | 4.94 | 2026-11-02T02:47Z | a5aad9c9419a15a5… |
| MS | 4,414 | 2.63 | 2026-11-02T07:30Z | 7d6f1999a3bd50f5… |
| MT | 5,536 | 2.43 | 2026-11-02T14:00Z | 96d1cc844d160b4b… |
| NC | 5,539 | 4.10 | 2026-11-02T01:57Z | 664168c0e2182958… |
| ND | 2,478 | 1.57 | 2026-11-02T01:56Z | 97cd76f35f0579d7… |
| NE | 14,420 | 29.33 | 2026-11-02T11:25Z | bdb69390978ccae4… |
| NH | 3,094 | 1.89 | 2026-11-02T13:13Z | 3f3fe59b7792957b… |
| NJ | 5,951 | 4.57 | 2026-11-01T23:07Z | b0c2eaab27c216ca… |
| NM | 4,154 | 2.80 | 2026-11-02T09:09Z | a51d2dd4f771d517… |
| NV | 4,161 | 2.35 | 2026-11-02T08:47Z | e84cbed36ac3b53e… |
| NY | 2,930 | 2.75 | 2026-11-02T01:57Z | ed560bb2a00e9250… |
| OH | 3,293 | 1.90 | 2026-11-02T01:57Z | 9a9849bf96a80aee… |
| OK | 2,619 | 1.81 | 2026-11-02T06:26Z | daafce4a89df4f14… |
| OR | 4,221 | 2.57 | 2026-11-02T06:09Z | c060250da0a96ca2… |
| PA | 5,935 | 2.76 | 2026-11-02T01:57Z | 5e4297f507a99446… |
| RI | 5,405 | 3.16 | 2026-11-02T14:27Z | 39fa88e092fbf281… |
| SC | 5,183 | 3.44 | 2026-11-02T04:43Z | f9e322864f5153bd… |
| SD | 6,450 | 4.65 | 2026-11-02T15:48Z | 17fb78162ccc9b64… |
| TN | 7,893 | 4.46 | 2026-11-02T01:35Z | c5ee6b2df999c21d… |
| TX | 2,694 | 2.49 | 2026-11-02T01:56Z | 4f675d8a33d94d42… |
| UT | 2,631 | 1.63 | 2026-11-02T18:10Z | 2eec2ed2d2f43da3… |
| VA | 3,067 | 2.25 | 2026-11-01T23:25Z | a876f8d72c7574aa… |
| VT | 3,286 | 2.20 | 2026-11-02T17:12Z | 091abfde4eac9be6… |
| WA | 4,548 | 3.94 | 2026-11-01T23:51Z | 65685b8c154c30a6… |
| WI | 4,013 | 2.67 | 2026-11-02T03:28Z | 83d6aa098fd59bea… |
| WV | 4,633 | 2.88 | 2026-11-02T11:51Z | adc066a11fd01d7d… |
| WY | 6,052 | 4.48 | 2026-11-02T17:47Z | 2a3285c87bd929aa… |

Observation, not a change: NE is 29.33 GB / 14,420 files, six to ten times any other state (its handbook is the largest; 9,760
narration clips). Noted for the upload order and for v2 size review; it ships as sealed.

## Shared bundle (shell, visuals, signs, fonts): SEALED
831 files · staged 2026-11-02T22:35:39Z (final, after the polish pass).

SHARED SEAL (2026-11-02 22:35:39Z re-stage, after the polish pass; 831 files, 132.4 MB; Fable verified all 831 sha256 against
the store mirror and the payload, 0 missing, 0 mismatches; ND READY re-verified by the watcher 22:38Z, 0 issues):

```
sha256(shared-manifest.json) = 34f51e3fd6af91f20171fb2c67f56eb619eaa48072399f743d923a9d0ccd0db9
```

The dataset is now CLOSED in full: 51 state payloads + shared bundle. Nothing moves after this line.

## What this means
Content authoring, fact-checking, image review, audio and video for v1 are DONE. Defects found from here go to
`coordination/BUGS/` as v2 notes. What remains is deployment, demo, repo flip, submission.
